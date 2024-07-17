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
import { FIREBASE_DB } from "@/firebase"; // Assuming FIREBASE_APP is already initialized elsewhere

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
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
  const [posts, setPosts] = useState<Post[]>([]);
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
      const q = query(postsRef);

      try {
        const querySnapshot = await getDocs(q);
        const fetchedPosts: Post[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Post;
          fetchedPosts.push({ ...data, id: doc.id });
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
      const postRef = doc.ref;

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

        const newPost = {
          content: newTweet,
          liked: false,
          likeCount: 0,
          comments: [],
        };

        const docRef = await addDoc(postsRef, newPost);

        setPosts((prevPosts) => [...prevPosts, { ...newPost, id: docRef.id }]);
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
      const postRef = doc(db, "posts", postId);
      await deleteDoc(postRef);

      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

      console.log(`Post (ID: ${postId}) deleted successfully.`);
      Alert.alert("Success", "Post deleted successfully.");
    } catch (error) {
      console.error("Error deleting post:", error);
      Alert.alert("Error", "There was an error deleting the post.");
    }
  };

  const handleAddComment = async (postId: string) => {
    if (commentText.trim().length > 0) {
      try {
        const postRef = doc(db, "posts", postId);
        const postSnapshot = await getDoc(postRef);

        if (!postSnapshot.exists()) {
          console.error("Post not found:", postId);
          return;
        }

        const existingComments = postSnapshot.data()?.comments || [];

        await updateDoc(postRef, {
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
        setIsEditingProfile(false); // Close the edit profile modal
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
          <Ionicons name="trash-outline" size={24} color="#dc3545" />
        </TouchableOpacity>
      </View>
      {selectedPostId === item.id && (
        <View style={styles.commentsContainer}>
          {item.comments.map((comment, index) => (
            <Text key={index} style={styles.comment}>
              {comment}
            </Text>
          ))}
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={(text) => setCommentText(text)}
          />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddComment(item.id)}
          >
            <Text style={styles.actionButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
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
                style={styles.input}
                placeholder="What's happening?"
                value={newTweet}
                onChangeText={(text) => setNewTweet(text)}
                multiline
              />
              <TouchableOpacity
                style={styles.saveProfileButton}
                onPress={handleAddPost}
              >
                <Text style={styles.saveProfileButtonText}>Save</Text>
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
                style={styles.input}
                placeholder="Name"
                value={editUserData?.name.toString()}
                onChangeText={(text) => handleChangeProfile("name", text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={editUserData?.age.toString()}
                onChangeText={(text) =>
                  handleChangeProfile("age", parseInt(text))
                }
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Location"
                value={editUserData?.location.toString()}
                onChangeText={(text) => handleChangeProfile("location", text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={editUserData?.email.toString()}
                onChangeText={(text) => handleChangeProfile("email", text)}
                keyboardType="email-address"
              />
              <TouchableOpacity
                style={styles.saveProfileButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveProfileButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.headerText}>Home</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={32} color="#007bff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        style={styles.postList}
      />

      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
        <Ionicons name="menu-outline" size={32} color="#007bff" />
      </TouchableOpacity>

      {isMenuOpen && (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <Text>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  postList: {
    flexGrow: 1,
  },
  post: {
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonText: {
    marginLeft: 5,
  },
  commentsContainer: {
    marginTop: 10,
  },
  comment: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: "100%",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxWidth: 400,
  },
  saveProfileButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  saveProfileButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  menuButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  menu: {
    position: "absolute",
    bottom: 70,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
