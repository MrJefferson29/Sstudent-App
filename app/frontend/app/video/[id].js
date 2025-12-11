import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../Contexts/AuthContext';
import { API_URL as BACKEND_API_URL, chatAPI } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMOTE_API_URL = 'https://ficedu-payment.onrender.com';
const { width } = Dimensions.get('window');
// Increase the video height by using a higher ratio (e.g., 0.75 for a 4:3 ratio look)
const VIDEO_HEIGHT = width * 0.75;

const VideoDetails = () => {
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const [videoDetails, setVideoDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const socketRef = useRef(null);
  const roomId = `video:${id}`;

  useEffect(() => {
    const fetchVideoDetails = async () => {
      const cacheKey = `videoDetails_${id}`;

      // Try cache first for instant load
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed) {
            setVideoDetails(parsed);
            setLoading(false);
            // Cache exists, try to refresh in background (but don't block UI)
            // Only fetch if we have network connectivity
            (async () => {
              try {
                const response = await axios.get(`${REMOTE_API_URL}/courses/video/${id}`);
                const data = response.data.data;
                setVideoDetails(data);
                
                // Cache the data
                try {
                  await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
                } catch (e) {
                  console.log('Error caching video details:', e);
                }
              } catch (error) {
                // Silently fail if offline - we already have cached data
                console.log('Background video refresh failed (offline?):', error);
              }
            })();
            return;
          }
        }
      } catch (e) {
        console.log('Error reading cached video details:', e);
      }

      // Only fetch if cache doesn't exist
      try {
        const response = await axios.get(`${REMOTE_API_URL}/courses/video/${id}`);
        const data = response.data.data;
        setVideoDetails(data);
        
        // Cache the data
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
          console.log('Error caching video details:', e);
        }
      } catch (error) {
        console.error('Error fetching video details:', error);
        // If network fails, try to use cached data
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed) {
              setVideoDetails(parsed);
            } else {
              Alert.alert('Error', 'Failed to load video details. Please check your connection.');
            }
          } else {
            Alert.alert('Error', 'Failed to load video details. Please check your connection.');
          }
        } catch (e) {
          Alert.alert('Error', 'Failed to load video details. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchVideoDetails();
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const loadChat = async () => {
      const cacheKey = `videoChat_${id}`;

      // Try cache first for instant load (even if empty)
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed)) {
            setChatMessages(parsed);
            setChatLoading(false);
            // Cache exists, try to refresh in background (but don't block UI)
            // Only fetch if we have network connectivity
            (async () => {
              try {
                const response = await chatAPI.getMessages('video', id);
                if (isMounted && response.success) {
                  const data = response.data || [];
                  setChatMessages(data);
                  
                  // Cache the messages
                  try {
                    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
                  } catch (e) {
                    console.log('Error caching chat messages:', e);
                  }
                }
              } catch (error) {
                // Silently fail if offline - we already have cached data
                console.log('Background chat refresh failed (offline?):', error);
              }
            })();
            return;
          }
        }
      } catch (e) {
        console.log('Error reading cached chat:', e);
      }

      // Only fetch if cache doesn't exist
      try {
        setChatLoading(true);
        const response = await chatAPI.getMessages('video', id);
        if (isMounted && response.success) {
          const data = response.data || [];
          setChatMessages(data);
          
          // Cache the messages
          try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
          } catch (e) {
            console.log('Error caching chat messages:', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch video chat:', error);
        // If network fails, try to use cached data (even if empty)
        try {
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached && isMounted) {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed)) {
              setChatMessages(parsed);
            }
          }
        } catch (e) {
          // Ignore cache read errors
        }
      } finally {
        if (isMounted) {
          setChatLoading(false);
        }
      }
    };

    if (id) {
      loadChat();
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

    const handleIncoming = async (message) => {
      if (message.resourceType === 'video' && message.resourceId === id) {
        setChatMessages((prev) => {
          const updated = [...prev, message];
          // Cache updated messages
          const cacheKey = `videoChat_${id}`;
          AsyncStorage.setItem(cacheKey, JSON.stringify(updated)).catch(e => {
            console.log('Error caching updated chat messages:', e);
          });
          return updated;
        });
      }
    };

    socket.on('chat_message', handleIncoming);

    return () => {
      socket.off('chat_message', handleIncoming);
      socket.disconnect();
    };
  }, [id, roomId]);

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      return;
    }

    const payload = {
      room: roomId,
      resourceType: 'video',
      resourceId: id,
      text: newMessage.trim(),
      isQuestion,
      userId: user?._id,
      username: user?.name || user?.fullName || user?.email || 'You',
    };

    socketRef.current?.emit('chat_message', payload);
    setNewMessage('');
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!videoDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Video details not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <TouchableOpacity
          style={styles.videoTouchable}
          onPress={() => setControlsVisible(!controlsVisible)}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoDetails.videoUrl || videoDetails.file }}
            style={styles.video}
            resizeMode="contain"
            shouldPlay={isPlaying}
            useNativeControls={false}
          />
          {controlsVisible && (
            <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={50} color="#FFF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.title}>{videoDetails.title}</Text>
        <View style={styles.chatSection}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatHeading}>Questions & Chat</Text>
            <TouchableOpacity
              style={styles.chatToggle}
              onPress={() => setIsQuestion((prev) => !prev)}
            >
              <Ionicons
                name={isQuestion ? 'help-circle' : 'chatbubble-outline'}
                size={20}
                color={isQuestion ? '#2563EB' : '#6B7280'}
              />
              <Text
                style={[
                  styles.chatToggleText,
                  isQuestion && styles.chatToggleTextActive,
                ]}
              >
                {isQuestion ? 'Question' : 'Comment'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder={
                isQuestion ? 'Ask a question about this video...' : 'Share your thoughts...'
              }
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
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
                <View key={message._id || message.id} style={styles.chatCard}>
                  <View style={styles.chatCardHeader}>
                    <Ionicons
                      name={message.isQuestion ? 'help-circle' : 'chatbubble'}
                      size={16}
                      color={message.isQuestion ? '#2563EB' : '#16A34A'}
                    />
                    <Text style={styles.chatAuthor}>{message.username || message.user?.name || 'Learner'}</Text>
                    {message.isQuestion && <Text style={styles.chatBadge}>Question</Text>}
                    <Text style={styles.chatTime}>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Immersive black background
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    backgroundColor: '#000',
    height: VIDEO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoTouchable: {
    width: '100%',
    height: '100%',
  },
  controlButton: {
    position: 'absolute',
    // Center the icon both horizontally and vertically
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }], // Adjust based on half the size of the icon
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 50,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    marginTop: -12, // Overlap slightly for a smooth transition
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  chatSection: {
    marginTop: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chatHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chatToggleText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  chatToggleTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  inputRow: {
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
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  chatLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyChatText: {
    marginTop: 12,
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
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 12,
  },
  chatTime: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#9CA3AF',
  },
  chatText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 20,
    color: '#d9534f',
  },
});

export default VideoDetails;