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
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  FieldValue,
  getDoc,
  getDocs,
  increment,
  query,
  setDoc,
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

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newTweet, setNewTweet] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    location: "New York, USA",
    interests: "Programming, Travel",
    profilePic: "😊", // Default emoji
  });
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  const emojis = ["😊", "😎", "🤓", "🤖"];

  const db = FIREBASE_DB;
  const postsRef = collection(db, "posts");

  useEffect(() => {
    const getPosts = async () => {
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

    getPosts();
  }, [db]);

  const toggleLike = async (postId: string) => {
    try {
      await handleToggleLike(postId);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleToggleLike = async (postId: string) => {
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
        liked: increment(likeChange),
        likeCount: FieldValue.increment(likeChange),
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

  const handleLogout = () => {
    // Implement logout logic here
    Alert.alert("Success", "Logged out successfully.");
  };

  const updatePostsLocally = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  const handleProfileUpdate = async () => {
    setIsProfileModalVisible(false);
    Alert.alert("Success", "Profile updated successfully.");
  };

  return (
    <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons
            name="person-circle-outline"
            size={32}
            color="black"
            onPress={() => setIsProfileModalVisible(true)}
          />
          <Text style={styles.headerText}>Nebula</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.postsList}
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.postContainer}>
              <View style={styles.postHeader}>
                <Text style={styles.postAuthor}>{profileData.name}</Text>
                <Text style={styles.postTime}>Just now</Text>
              </View>
              <Text style={styles.postContent}>{item.content}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.postActionButton}
                  onPress={() => toggleLike(item.id)}
                >
                  <Ionicons
                    name={item.liked ? "heart" : "heart-outline"}
                    size={24}
                    color={item.liked ? "red" : "black"}
                  />
                  <Text style={styles.actionButtonText}>{item.likeCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.postActionButton}
                  onPress={() => toggleComments(item.id)}
                >
                  <Ionicons name="chatbox-outline" size={24} color="black" />
                  <Text style={styles.actionButtonText}>
                    {item.comments.length}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePost(item.id)}
                >
                  <Ionicons name="trash-outline" size={24} color="black" />
                </TouchableOpacity>
              </View>
              {selectedPostId === item.id && (
                <View style={styles.commentsContainer}>
                  <FlatList
                    data={item.comments}
                    keyExtractor={(comment) => comment}
                    renderItem={({ item }) => (
                      <View style={styles.commentContainer}>
                        <Text style={styles.commentText}>{item}</Text>
                      </View>
                    )}
                  />
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    value={commentText}
                    onChangeText={(text) => setCommentText(text)}
                    onSubmitEditing={() => handleAddComment(item.id)}
                  />
                </View>
              )}
            </View>
          )}
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>

        <Modal visible={isModalVisible} animationType="slide">
          <View style={styles.modalContainer}>
            <TextInput
              style={styles.modalInput}
              placeholder="What's on your mind?"
              multiline
              numberOfLines={4}
              value={newTweet}
              onChangeText={(text) => setNewTweet(text)}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddPost}
            >
              <Text style={styles.buttonText}>Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal visible={isProfileModalVisible} animationType="slide">
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              value={profileData.name}
              onChangeText={(text) =>
                setProfileData({ ...profileData, name: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              value={profileData.email}
              onChangeText={(text) =>
                setProfileData({ ...profileData, email: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Location"
              value={profileData.location}
              onChangeText={(text) =>
                setProfileData({ ...profileData, location: text })
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Interests"
              value={profileData.interests}
              onChangeText={(text) =>
                setProfileData({ ...profileData, interests: text })
              }
            />
            <Text style={styles.modalLabel}>Choose Profile Emoji:</Text>
            <View style={styles.emojiContainer}>
              {emojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.emojiButton,
                    {
                      backgroundColor:
                        profileData.profilePic === emoji ? "lightblue" : "white",
                    },
                  ]}
                  onPress={() =>
                    setProfileData({ ...profileData, profilePic: emoji })
                  }
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleProfileUpdate}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setIsProfileModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
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
  logoutButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "lightblue",
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  postsList: {
    flexGrow: 1,
    marginBottom: 20,
  },
  postContainer: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  postAuthor: {
    fontWeight: "bold",
    fontSize: 16,
  },
  postTime: {
    color: "gray",
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  postActionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonText: {
    marginLeft: 5,
  },
  deleteButton: {
    alignItems: "flex-end",
  },
  commentsContainer: {
    marginTop: 10,
  },
  commentContainer: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  commentText: {
    fontSize: 14,
  },
  commentInput: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "lightblue",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  modalButton: {
    width: "100%",
    backgroundColor: "lightblue",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  emojiContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  emojiButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  emojiText: {
    fontSize: 20,
  },
});
