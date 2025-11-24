import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { AuthContext } from '../Contexts/AuthContext';
import { API_URL as BACKEND_API_URL, chatAPI } from '../utils/api';

const REMOTE_API_URL = 'https://ficedu-payment.onrender.com';

const ChapterList = () => {
  const { id, heading } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  // New chapter form state
  const [newChapterTitle, setNewChapterTitle] = useState('');
  // New video forms for each chapter (key: chapter id)
  // Each value will include title, description and file (object from ImagePicker)
  const [newVideoInputs, setNewVideoInputs] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isChatQuestion, setIsChatQuestion] = useState(false);
  const socketRef = useRef(null);
  const router = useRouter();
  const roomId = `course:${id}`;

  useEffect(() => {
    fetchChapters();
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        setChatLoading(true);
        const response = await chatAPI.getMessages('course', id);
        if (isMounted && response.success) {
          setChatMessages(response.data || []);
        }
      } catch (err) {
        console.error('Error fetching course chat:', err);
      } finally {
        if (isMounted) {
          setChatLoading(false);
        }
      }
    };

    if (id) {
      loadHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const socket = io(BACKEND_API_URL, {
      transports: ['websocket'],
      path: '/socket.io',
    });
    socketRef.current = socket;
    socket.emit('join_chat', { room: roomId });

    const handleIncoming = (message) => {
      if (message.resourceType === 'course' && message.resourceId === id) {
        setChatMessages((prev) => [...prev, message]);
      }
    };

    socket.on('chat_message', handleIncoming);

    return () => {
      socket.off('chat_message', handleIncoming);
      socket.disconnect();
    };
  }, [id, roomId]);

  const handleSendChatMessage = () => {
    if (!newChatMessage.trim()) return;
    const payload = {
      room: roomId,
      resourceType: 'course',
      resourceId: id,
      text: newChatMessage.trim(),
      isQuestion: isChatQuestion,
      userId: user?._id,
      username: user?.name || user?.fullName || user?.email || 'Learner',
    };

    socketRef.current?.emit('chat_message', payload);
    setNewChatMessage('');
  };

  const fetchChapters = async () => {
    try {
      const response = await axios.get(`${REMOTE_API_URL}/courses/all-chapters/${id}`);
      setChapters(response.data.data);
    } catch (err) {
      setError('Failed to fetch chapters');
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleVideoPress = (videoId) => {
    router.push({
      pathname: `/video/${videoId}`,
    });
  };

  // New Chapter submission handler
  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) {
      Alert.alert('Validation', 'Chapter title cannot be empty');
      return;
    }
    try {
      // Assumes endpoint: POST /courses/:courseId/create-chapter
      const response = await axios.post(`${REMOTE_API_URL}/courses/${id}/create-chapter`, {
        title: newChapterTitle,
      });
      if (response.data.success) {
        Alert.alert('Success', 'Chapter created successfully');
        setNewChapterTitle('');
        fetchChapters();
      } else {
        Alert.alert('Error', 'Failed to create chapter');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred while creating chapter');
    }
  };

  // New Video picker using ImagePicker (configured strictly for videos)
  const pickVideoFile = async (chapterId) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });
      console.log('Picker result:', result);
      if (!result.cancelled) {
        // For newer versions, result.assets is an array
        const uri = result.assets ? result.assets[0].uri : result.uri;
        if (!uri) {
          Alert.alert('Error', 'No video URI found');
          return;
        }
        setNewVideoInputs((prev) => ({
          ...prev,
          [chapterId]: {
            ...prev[chapterId],
            file: {
              uri,
              name: `video_${Date.now()}.mp4`,
              type: 'video/mp4',
            },
          },
        }));
      } else {
        Alert.alert('No video selected');
      }
    } catch (err) {
      console.error('Error picking video file:', err);
      Alert.alert('Error', 'Failed to pick video file');
    }
  };
  
  // New Video submission handler for a specific chapter using FormData
  const handleCreateVideo = async (chapterId) => {
    console.log('Current Video Inputs:', newVideoInputs); // Debugging log

    const videoData = newVideoInputs[chapterId];
    if (!videoData || !videoData.title) {
      Alert.alert('Validation', 'Video title is required');
      return;
    }
    if (!videoData.file) {
      Alert.alert('Validation', 'Please select an MP4 file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', videoData.title);
      formData.append('description', videoData.description || '');
      formData.append('video', videoData.file);

      console.log('Submitting Video Data:', formData);

      const response = await axios.post(`${REMOTE_API_URL}/courses/${chapterId}/create-video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        Alert.alert('Success', 'Video created successfully');
        setNewVideoInputs((prev) => ({
          ...prev,
          [chapterId]: { title: '', description: '', file: null },
        }));
        fetchChapters();
      } else {
        Alert.alert('Error', 'Failed to create video');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred while creating video');
    }
  };

  const renderChapterList = () => {
    if (loading) {
      return (
        <ActivityIndicator size="large" color="#0000ff" />
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={chapters}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.chapterCard}>
            <Pressable onPress={() => toggleDropdown(index)} style={styles.chapterHeader}>
              <Text style={styles.chapterTitle}>{item.title}</Text>
            </Pressable>
            {expandedIndex === index && (
              <View style={styles.dropdownContent}>
                {item.videos && item.videos.length > 0 ? (
                  item.videos.map((video, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleVideoPress(video._id)}
                      style={styles.videoCard}
                    >
                      <Video
                        source={{ uri: video.videoUrl }}
                        style={styles.video}
                        resizeMode="cover"
                        useNativeControls
                      />
                      <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle}>{video.title}</Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.noVideos}>No videos available.</Text>
                )}
                {/* New Video Form */}
                {/* <View style={styles.newVideoForm}>
                  <Text style={styles.formHeader}>Add New Video</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Video Title"
                    value={(newVideoInputs[item._id] && newVideoInputs[item._id].title) || ''}
                    onChangeText={(text) =>
                      setNewVideoInputs((prev) => ({
                        ...prev,
                        [item._id]: { ...prev[item._id], title: text },
                      }))
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Video Description"
                    value={(newVideoInputs[item._id] && newVideoInputs[item._id].description) || ''}
                    onChangeText={(text) =>
                      setNewVideoInputs((prev) => ({
                        ...prev,
                        [item._id]: { ...prev[item._id], description: text },
                      }))
                    }
                  />
                  <TouchableOpacity
                    style={styles.selectFileButton}
                    onPress={() => pickVideoFile(item._id)}
                  >
                    <Text style={styles.selectFileButtonText}>
                      {newVideoInputs[item._id] && newVideoInputs[item._id].file
                        ? 'File Selected'
                        : 'Select MP4 File'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => handleCreateVideo(item._id)}
                  >
                    <Text style={styles.submitButtonText}>Create Video</Text>
                  </TouchableOpacity>
                </View> */}
              </View>
            )}
          </View>
        )}
      />
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>VIDEOS FOR {heading}</Text>
      {renderChapterList()}
      <View style={styles.chatSection}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>Course Chat & Questions</Text>
          <TouchableOpacity
            style={styles.chatToggle}
            onPress={() => setIsChatQuestion((prev) => !prev)}
          >
            <Ionicons
              name={isChatQuestion ? 'help-circle' : 'chatbubble-outline'}
              size={18}
              color={isChatQuestion ? '#2563EB' : '#6B7280'}
            />
            <Text
              style={[
                styles.chatToggleText,
                isChatQuestion && styles.chatToggleTextActive,
              ]}
            >
              {isChatQuestion ? 'Question' : 'Comment'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder={
              isChatQuestion
                ? 'Ask about this course...'
                : 'Share a helpful tip...'
            }
            multiline
            value={newChatMessage}
            onChangeText={setNewChatMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newChatMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSendChatMessage}
            disabled={!newChatMessage.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        {chatLoading ? (
          <View style={styles.chatLoading}>
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        ) : chatMessages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyChatText}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        ) : (
          <View style={styles.chatList}>
            {chatMessages.map((message) => (
              <View key={message.id || message._id} style={styles.chatCard}>
                <View style={styles.chatCardHeader}>
                  <Ionicons
                    name={message.isQuestion ? 'help-circle' : 'chatbubble'}
                    size={16}
                    color={message.isQuestion ? '#2563EB' : '#16A34A'}
                  />
                  <Text style={styles.chatAuthor}>{message.username || 'Learner'}</Text>
                  {message.isQuestion && <Text style={styles.chatBadge}>Question</Text>}
                  <Text style={styles.chatTimestamp}>
                    {message.createdAt
                      ? new Date(message.createdAt).toLocaleTimeString()
                      : ''}
                  </Text>
                </View>
                <Text style={styles.chatText}>{message.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {/* New Chapter Form */}
      {/* <View style={styles.newChapterForm}>
        <Text style={styles.formHeader}>Add New Chapter</Text>
        <TextInput
          style={styles.input}
          placeholder="Chapter Title"
          value={newChapterTitle}
          onChangeText={setNewChapterTitle}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleCreateChapter}>
          <Text style={styles.submitButtonText}>Create Chapter</Text>
        </TouchableOpacity>
      </View> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#D9534F',
    fontSize: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  chapterCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chapterHeader: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomColor: '#ececec',
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  dropdownContent: {
    padding: 15,
    backgroundColor: '#fafafa',
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  video: {
    width: 120,
    height: 80,
    backgroundColor: '#000',
  },
  videoInfo: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#555',
  },
  noVideos: {
    fontStyle: 'italic',
    color: '#888',
    marginBottom: 10,
  },
  newChapterForm: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  newVideoForm: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  formHeader: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  selectFileButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectFileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4287f5',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  chatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chatToggleText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#6B7280',
  },
  chatToggleTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  chatLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyChatText: {
    marginTop: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  chatList: {
    gap: 12,
  },
  chatCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  chatCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    marginBottom: 6,
  },
  chatAuthor: {
    fontWeight: '600',
    color: '#111827',
  },
  chatBadge: {
    marginLeft: 6,
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 11,
  },
  chatTimestamp: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#9CA3AF',
  },
  chatText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
});

export default ChapterList;