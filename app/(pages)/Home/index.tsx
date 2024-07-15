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

  const [newTweet, setNewTweet] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const db = FIREBASE_DB;
  const postsRef = collection(db, "posts");

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
        // Handle errors appropriately, like showing an error message
        Alert.alert("Error", "There was an error fetching posts.");
      }
    };

    getPosts();
  }, [db]);

  const toggleLike = async (postId: string) => {
    try {
      await handleToggleLike(postId, posts, setPosts);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Handle error gracefully, e.g., show a toast message or update UI state
    }
  };

  const handleToggleLike = async (
    postId: string,
    posts: Post[],
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>,
  ) => {
    try {
      // Query Firestore for the document with matching ID
      const q = query(collection(db, "posts"), where("id", "==", postId));
      const querySnapshot = await getDocs(q);

      // Check if document exists and throw error if not
      if (querySnapshot.empty) {
        throw new Error("No document found with id: " + postId);
      }

      // Get the matching document (should be only one assuming unique ID)
      const doc = querySnapshot.docs[0]; // Assuming unique ID
      const { liked } = doc.data(); // Destructuring for readability

      // Update 'liked' field using conditional increment
      const likeChange = liked ? -1 : 1;
      const postRef = querySnapshot.docs[0].ref;

      await updateDoc(postRef, {
        liked: increment(likeChange),
      });

      // Update local state efficiently (optional)
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, liked: !liked, likeCount: post.likeCount + likeChange }
            : post,
        ),
      );
    } catch (error) {
      console.error("Error updating like:", error);
      // Handle errors appropriately, like showing an error message to the user
    }
  };

  const handleAddPost = async () => {
    if (newTweet.trim().length > 0) {
      try {
        const postsRef = collection(db, "posts");

        const newPostId = doc(postsRef).id; // Generate a unique ID

        const newPost = {
          id: newPostId,
          content: newTweet,
          liked: false,
          likeCount: 0,
          comments: [],
        };

        await addDoc(postsRef, newPost); // Add the new post to Firestore

        setPosts((prevPosts) => [...prevPosts, newPost]);
        setNewTweet("");
        setIsModalVisible(false);
        Alert.alert("Success", "Post added successfully.");
      } catch (error) {
        console.error("Error adding post:", error);
        // Handle errors appropriately, like showing an error message to the user
        Alert.alert("Error", "There was an error adding the post.");
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("id", "==", postId)); // Filter by author

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });

      console.log(`Post (ID: ${postId}) deleted successfully.`);
      Alert.alert("Success", "Post deleted successfully.");
      updatePostsLocally(postId); // Update local state
    } catch (error) {
      console.error("Error deleting posts by author:", error);
      // Handle errors appropriately (e.g., notify user)
      Alert.alert("Error", "There was an error deleting the post.");
    }
  };

  const handleAddComment = async (postId: string) => {
    if (commentText.trim().length > 0) {
      try {
        // Build a query to get the specific post document
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("id", "==", postId));

        // Fetch the post document
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error("Post not found:", postId);
          // Handle the case where the post doesn't exist
          return;
        }

        // Get the first document (assuming unique ID)
        const doc = querySnapshot.docs[0].ref;

        // Get the document data (fixes the error)
        const postData = await getDoc(doc);

        // Get existing comments (optional)
        const existingComments = postData.data().comments || []; // Handle potential undefined value

        // Update the post document with the new comment
        await updateDoc(doc, {
          comments: [...existingComments, commentText],
        });

        // Update local state to reflect the new comment
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                ...post,
                comments: [...post.comments, commentText],
              }
              : post,
          ),
        );

        // Clear the comment text input
        setCommentText("");

        console.log("Comment added successfully!");
        Alert.alert("Success", "Comment added successfully.");
      } catch (error) {
        console.error("Error adding comment:", error);
        Alert.alert("Success", "Comment added successfully.");
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
    // Implement logout logic here
    setIsMenuOpen(false); // Close the menu after logout
    Alert.alert("Success", "Logged out successfully.");
  };

  // Helper function to update local state (assuming it exists)
  const updatePostsLocally = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
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

      {/* Comments Section */}
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
    <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Ionicons name="menu-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Nebula</Text>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              /* Handle profile button press */
            }}
          >
            <Ionicons name="person-circle-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Posts List */}
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          style={styles.postList}
          contentContainerStyle={{ paddingBottom: 120 }}
        />

        {/* Floating Action Button (Post Button) */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add-outline" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Side Menu */}
        {isMenuOpen && (
          <View style={styles.sideMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons
                name="log-out-outline"
                size={24}
                color="#007bff"
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modal for Adding Tweet */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                value={newTweet}
                onChangeText={setNewTweet}
                placeholder="What's happening?"
                style={styles.input}
                multiline
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAddPost}
              >
                <Text style={styles.modalButtonText}>Tweet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#007bff",
    paddingVertical: 20,
    paddingHorizontal: 10,
    paddingTop: 40,
  },
  headerText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10, // Add margin for better spacing
  },
  profileButton: {
    padding: 10,
  },
  menuButton: {
    padding: 10,
  },
  postList: {
    flex: 1,
  },
  post: {
    backgroundColor: "#ffffff",
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  actionButtonText: {
    fontSize: 20,
    marginLeft: 5,
  },
  commentsContainer: {
    marginTop: 10,
  },
  commentInput: {
    borderColor: "#cccccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  commentButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: "18%",
  },
  commentButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  comment: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  input: {
    borderColor: "#cccccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    maxHeight: 150,
  },
  modalButton: {
    padding: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: "#007bff",
  },
  sideMenu: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    backgroundColor: "#ffffff",
    borderRightColor: "#007bff",
    borderRightWidth: 1,
    zIndex: 1000,
  },
  menuItem: {
    paddingTop: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: "#007bff",
    borderBottomWidth: 1,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 16,
    color: "#007bff",
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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
