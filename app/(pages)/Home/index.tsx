import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput, Modal, Alert } from 'react-native';
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
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    location: 'New York, USA',
    interests: 'Programming, Travel',
    profilePic: '😊', // Default emoji
  });

  const emojis = ['😊', '😎', '🤓', '🤖'];

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
          <Text style={[styles.actionButtonText, { color: '#007bff' }]}> 💬 </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeletePost(item.id)}>
          <Text style={[styles.actionButtonText, { color: 'red' }]}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {selectedPostId === item.id && (
        <View style={styles.commentsContainer}>
          <Text style={styles.commentsHeading}>Comments</Text>
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

  const handleProfileUpdate = () => {
    Alert.alert('Profile Updated', 'Your profile information has been updated.');
    setIsProfileModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Nebula - An Anonymous Public Opinion App</Text>
        <View style={styles.emojiContainer}>
          {emojis.map(emoji => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiButton}
              onPress={() => {}}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        style={styles.postList}
        contentContainerStyle={{ paddingBottom: 120 }} // Ensure content doesn't get covered by buttons
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
            
            {/* Profile Picture Selection */}
            <View style={styles.emojiContainer}>
              {emojis.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    profileData.profilePic === emoji && styles.selectedEmojiButton,
                  ]}
                  onPress={() => setProfileData({ ...profileData, profilePic: emoji })}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              style={styles.profileInput}
              value={profileData.name}
              onChangeText={text => setProfileData({ ...profileData, name: text })}
              placeholder="Name"
            />
            <TextInput
              style={styles.profileInput}
              value={profileData.email}
              onChangeText={text => setProfileData({ ...profileData, email: text })}
              placeholder="Email"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.profileInput}
              value={profileData.location}
              onChangeText={text => setProfileData({ ...profileData, location: text })}
              placeholder="Location"
            />
            <TextInput
              style={styles.profileInput}
              value={profileData.interests}
              onChangeText={text => setProfileData({ ...profileData, interests: text })}
              placeholder="Interests"
            />
            
            <TouchableOpacity style={styles.profileModalButton} onPress={handleProfileUpdate}>
              <Text style={styles.profileModalButtonText}>Update</Text>
            </TouchableOpacity>
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
    backgroundColor: '#f0f0f0',
  },
  header: {
    backgroundColor: '#007bff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  
  headerText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  postList: {
    flex: 1,
  },
  post: {
    backgroundColor: '#ffffff',
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  postImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 5,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    padding: 10,
  },
  actionButtonText: {
    fontSize: 20,
  },
  commentsContainer: {
    marginTop: 10,
  },
  commentsHeading: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  commentInput: {
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 10, // Rounded border radius
    padding: 10,
    marginBottom: 10,
    width: '80%', // Adjust width as needed
  },
  commentButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '18%', // Adjust width as needed
  },
  commentButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  comment: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 30,
  },
  profileButton: {
    position: 'absolute',
    bottom: 30,
    right: 110, // Adjust right position to move next to FAB
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  profileButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  logoutButton: {
    position: 'absolute',
    bottom: 30,
    left: 30, // Adjust left position to move next to FAB
    padding: 10,
    backgroundColor: '#dc3545',
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  input: {
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    maxHeight: 150,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  profileModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  profileModalContent: {
    width: 300,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  profileHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileInput: {
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  profileModalButton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  profileModalButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  emojiButton: {
    padding: 10,
    borderRadius: 5,
  },
  selectedEmojiButton: {
    backgroundColor: '#007bff',
  },
  emoji: {
    fontSize: 24,
  },
});
