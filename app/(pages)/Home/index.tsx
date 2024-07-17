import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import firebase from "firebase/app";
import { FIREBASE_DB, FIREBASE_APP } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

interface Post {
  id: string;
  content: string;
  liked: boolean;
  likeCount: number;
  comments: string[];
}

interface User {
  id: string;
  name: string;
  age: number;
  location: string;
  email: string;
}

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      content: "Hello World!",
      liked: false,
      likeCount: 0,
      comments: [],
    },
    {
      id: "2",
      content: "This is a social media app.",
      liked: false,
      likeCount: 0,
      comments: [],
    },
    {
      id: "3",
      content: "I made an app!",
      liked: false,
      likeCount: 0,
      comments: [],
    },
  ]);

  const [user, setUser] = useState<User | null>(null);
  const [newTweet, setNewTweet] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUserData, setEditUserData] = useState<User | null>(null);

  const db = FIREBASE_DB;

  useEffect(() => {
    const getPosts = async () => {
      const postsRef = collection(db, "posts");
      const q = query(postsRef); // Optional: Add query filters if needed

      try {
        const querySnapshot = await getDocs(q);
        const fetchedPosts: Post[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Post;
          fetchedPosts.push(data);
        });
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        Alert.alert("Error", "There was an error fetching posts.");
      }
    };

    const getUser = async () => {
      const userRef = doc(db, "users", "currentUserId"); // Replace with actual user ID logic
      try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    getPosts();
    getUser();
  }, [db]);

  const toggleLike = async (postId: string) => {
    try {
      await handleToggleLike(postId, posts, setPosts);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleToggleLike = async (
    postId: string,
    posts: Post[],
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>
  ) => {
    try {
      const q = query(collection(db, "posts"), where("id", "==", postId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No document found with id: " + postId);
      }

      const doc = querySnapshot.docs[0];
      const { liked } = doc.data();

      const likeChange = liked ? -1 : 1;
      const postRef = querySnapshot.docs[0].ref;

      await updateDoc(postRef, {
        liked: !liked,
        likeCount: doc.data().likeCount + likeChange,
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, liked: !liked, likeCount: post.likeCount + likeChange }
            : post
        )
      );
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleAddPost = async () => {
    if (newTweet.trim().length > 0) {
      try {
        const postsRef = collection(db, "posts");

        const newPostId = doc(postsRef).id;

        const newPost = {
          id: newPostId,
          content: newTweet,
          liked: false,
          likeCount: 0,
          comments: [],
        };

        await addDoc(postsRef, newPost);

        setPosts((prevPosts) => [...prevPosts, newPost]);
        setNewTweet("");
        setIsModalVisible(false);
        Alert.alert("Success", "Post added successfully.");
      } catch (error) {
        console.error("Error adding post:", error);
        Alert.alert("Error", "There was an error adding the post.");
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("id", "==", postId));

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });

      console.log(`Post (ID: ${postId}) deleted successfully.`);
      Alert.alert("Success", "Post deleted successfully.");
      updatePostsLocally(postId);
    } catch (error) {
      console.error("Error deleting posts by author:", error);
      Alert.alert("Error", "There was an error deleting the post.");
    }
  };

  const handleAddComment = async (postId: string) => {
    if (commentText.trim().length > 0) {
      try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("id", "==", postId));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error("Post not found:", postId);
          return;
        }

        const doc = querySnapshot.docs[0].ref;

        const postData = await getDoc(doc);

        const existingComments = postData.data().comments || [];

        await updateDoc(doc, {
          comments: [...existingComments, commentText],
        });

        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: [...post.comments, commentText],
                }
              : post
          )
        );

        setCommentText("");

        console.log("Comment added successfully!");
        Alert.alert("Success", "Comment added successfully.");
      } catch (error) {
        console.error("Error adding comment:", error);
        Alert.alert("Error", "There was an error adding the comment.");
      }
    }
  };

  const toggleComments = (postId: string) => {
    setSelectedPostId((prevId) => (prevId === postId ? null : postId));
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    Alert.alert("Success", "Logged out successfully.");
  };

  const updatePostsLocally = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  const handleEditProfile = () => {
    setEditUserData(user);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (editUserData) {
      try {
        const userRef = doc(db, "users", editUserData.id);
        await updateDoc(userRef, editUserData);
        setUser(editUserData);
        setIsEditingProfile(false);
        Alert.alert("Success", "Profile updated successfully.");
      } catch (error) {
        console.error("Error updating profile:", error);
        Alert.alert("Error", "There was an error updating the profile.");
      }
    }
  };

  const handleChangeProfile = (key: keyof User, value: string | number) => {
    if (editUserData) {
      setEditUserData({ ...editUserData, [key]: value });
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.post}>
      <Text>{item.content}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleLike(item.id)}
        >
          <Text style={styles.actionButtonText}>
            {item.liked ? "❤️" : "🤍"} {item.likeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleComments(item.id)}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={24}
            color="#007bff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeletePost(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>

      {selectedPostId === item.id && (
        <View style={styles.commentsContainer}>
          <FlatList
            data={item.comments}
            keyExtractor={(comment, index) => index.toString()}
            renderItem={({ item: comment }) => (
              <View style={styles.comment}>
                <Text>{comment}</Text>
              </View>
            )}
          />
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            style={styles.commentInput}
          />
          <TouchableOpacity
            style={styles.commentButton}
            onPress={() => handleAddComment(item.id)}
          >
            <Text style={styles.commentButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Home</Text>
        <TouchableOpacity onPress={toggleMenu} style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={40} color="#007bff" />
        </TouchableOpacity>
        <Modal
          visible={isMenuOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={toggleMenu}
        >
          <TouchableWithoutFeedback onPress={toggleMenu}>
            <View style={styles.modalBackground}>
              <View style={styles.menuContainer}>
                {user && (
                  <View style={styles.profileContainer}>
                    <Ionicons
                      name="person-circle-outline"
                      size={40}
                      color="#007bff"
                    />
                    <Text style={styles.userName}>{user.name}</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={handleEditProfile}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuItemText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
                  <Text style={styles.menuItemText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.postList}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={40} color="#007bff" />
      </TouchableOpacity>
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <TextInput
                value={newTweet}
                onChangeText={setNewTweet}
                placeholder="What's on your mind?"
                style={styles.input}
                multiline
              />
              <TouchableOpacity
                style={styles.postButton}
                onPress={handleAddPost}
              >
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal
        visible={isEditingProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingProfile(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsEditingProfile(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <TextInput
                value={editUserData?.name || ""}
                onChangeText={(value) => handleChangeProfile("name", value)}
                placeholder="Name"
                style={styles.input}
              />
              <TextInput
                value={editUserData?.age.toString() || ""}
                onChangeText={(value) => handleChangeProfile("age", Number(value))}
                placeholder="Age"
                style={styles.input}
                keyboardType="numeric"
              />
              <TextInput
                value={editUserData?.location || ""}
                onChangeText={(value) => handleChangeProfile("location", value)}
                placeholder="Location"
                style={styles.input}
              />
              <TextInput
                value={editUserData?.email || ""}
                onChangeText={(value) => handleChangeProfile("email", value)}
                placeholder="Email"
                style={styles.input}
                keyboardType="email-address"
              />
              <TouchableOpacity
                style={styles.postButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.postButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileButton: {
    padding: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: 250,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  menuItem: {
    padding: 12,
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#007bff",
  },
  postList: {
    paddingBottom: 16,
  },
  post: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    color: "#007bff",
  },
  commentsContainer: {
    marginTop: 8,
  },
  comment: {
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  commentInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  commentButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  commentButtonText: {
    color: "#fff",
  },
  addButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    width: 300,
    alignItems: "center",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    width: "100%",
  },
  postButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    width: "100%",
  },
  postButtonText: {
    color: "#fff",
  },
});
