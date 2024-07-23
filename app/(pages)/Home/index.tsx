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

  const toggleLike = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId ? { ...post, liked: !post.liked } : post
      )
    );
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
            <Text style={styles.profileTitle}>Update Profile</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              value={profileData.name}
              onChangeText={(text) =>
                setProfileData((prevData) => ({ ...prevData, name: text }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              value={profileData.email}
              onChangeText={(text) =>
                setProfileData((prevData) => ({ ...prevData, email: text }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Location"
              value={profileData.location}
              onChangeText={(text) =>
                setProfileData((prevData) => ({ ...prevData, location: text }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Interests"
              value={profileData.interests}
              onChangeText={(text) =>
                setProfileData((prevData) => ({ ...prevData, interests: text }))
              }
            />
            <Text style={styles.emojiTitle}>Select Profile Emoji:</Text>
            <View style={styles.emojiContainer}>
              {emojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.emojiButton,
                    emoji === profileData.profilePic && styles.selectedEmoji,
                  ]}
                  onPress={() =>
                    setProfileData((prevData) => ({
                      ...prevData,
                      profilePic: emoji,
                    }))
                  }
                >
                  <Text style={styles.emoji}>{emoji}</Text>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  postsList: {
    flex: 1,
  },
  postContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  postAuthor: {
    fontWeight: "bold",
  },
  postTime: {
    color: "#999",
  },
  postContent: {
    marginBottom: 10,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  postActionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    marginLeft: 10,
  },
  actionButtonText: {
    marginLeft: 5,
  },
  commentsContainer: {
    marginTop: 10,
  },
  commentContainer: {
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 5,
    marginBottom: 5,
  },
  commentText: {
    color: "#333",
  },
  commentInput: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007bff",
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
    padding: 20,
  },
  modalInput: {
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  emojiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emojiContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  emojiButton: {
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 5,
  },
  selectedEmoji: {
    backgroundColor: "#eee",
  },
  emoji: {
    fontSize: 24,
  },
});
