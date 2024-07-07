import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([
    { id: '1', content: 'Hello World!', imageUrl: null, liked: false, comments: [] },
    { id: '2', content: 'This is a social media app.', imageUrl: null, liked: false, comments: [] },
    { id: '3', content: 'I made an app!', imageUrl: null, liked: false, comments: [] },
  ]);
  const [newTweet, setNewTweet] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false); // State for showing Add Photo button
  const [commentText, setCommentText] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null); // State to track which post has opened comments
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false); // State for profile modal

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  const handleToggleLike = (postId) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, liked: !post.liked } : post
      )
    );
  };

  const handleAddPost = () => {
    if (newTweet.trim().length > 0) {
      const newPost = {
        id: (posts.length + 1).toString(),
        content: newTweet,
        imageUrl: null,
        liked: false,
        comments: [],
      };
      setPosts(prevPosts => [...prevPosts, newPost]);
      setNewTweet('');
      setIsModalVisible(false);
      setShowAddPhoto(false); // Reset state when modal is closed
    }
  };

  const handleDeletePost = (postId) => {
    setPosts(prevPosts =>
      prevPosts.filter(post => post.id !== postId)
    );
  };

  const toggleAddPhoto = () => {
    setShowAddPhoto(!showAddPhoto);
  };

  const navigateToProfile = () => {
    setIsProfileModalVisible(true);
  };

  const renderPost = ({ item }) => (
    <View style={styles.post}>
      <Text>{item.content}</Text>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
      )}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleToggleLike(item.id)}>
          <Text style={styles.actionButtonText}>
            {item.liked ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setSelectedPostId(item.id)}>
          <Text style={[styles.actionButtonText, { color: '#007bff' }]}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeletePost(item.id)}>
          <Text style={[styles.actionButtonText, { color: 'red' }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {selectedPostId === item.id && (
        <View style={styles.commentsContainer}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            style={styles.commentInput}
          />
          <TouchableOpacity style={styles.commentButton} onPress={() => handleAddComment(item.id)}>
            <Text style={styles.commentButtonText}>Post</Text>
          </TouchableOpacity>
          <FlatList
            data={item.comments}
            keyExtractor={(comment, index) => index.toString()}
            renderItem={({ item: comment }) => (
              <View style={styles.comment}>
                <Text>{comment}</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );

  const handleAddComment = (postId) => {
    if (commentText.trim().length > 0) {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, comments: [...post.comments, commentText] } : post
        )
      );
      setCommentText('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Social Media App</Text>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        style={styles.postList}
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Profile Button */}
      <TouchableOpacity style={styles.profileButton} onPress={navigateToProfile}>
        <Text style={styles.profileButtonText}>Profile</Text>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

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
            
            {/* Add Photo Button */}
            {showAddPhoto && (
              <TouchableOpacity style={styles.modalButton} onPress={handleAddPhoto}>
                <Text style={styles.modalButtonText}>Add Photo</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleAddPost}>
                <Text style={styles.modalButtonText}>Tweet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={isProfileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <View style={styles.profileModalContainer}>
          <View style={styles.profileModalContent}>
            <Text style={styles.profileHeaderText}>Profile</Text>
            {/* Add your profile information layout here */}
            <Text>Name: John Doe</Text>
            <Text>Email: john.doe@example.com</Text>
            <Text>Location: New York, USA</Text>
            <Text>Interests: Programming, Travel</Text>
            
            <TouchableOpacity style={styles.profileModalButton} onPress={() => setIsProfileModalVisible(false)}>
              <Text style={styles.profileModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#1da1f2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
    marginTop: 20, // Adjusted margin top to push it down
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  postList: {
    paddingHorizontal: 20,
  },
  post: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  actionButtonText: {
    fontSize: 18,
  },
  commentsContainer: {
    marginTop: 10,
  },
  commentInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  commentButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  commentButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    elevation: 3,
  },
  fabIcon: {
    fontSize: 30,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 10,
    padding: 20,
  },
  input: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginLeft: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center', // Center horizontally
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 10,
    padding: 20,
  },
  profileHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileModalButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  profileModalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
