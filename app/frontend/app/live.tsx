import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import YoutubePlayer from 'react-native-youtube-iframe';
import { io } from 'socket.io-client';
import { liveSessionsAPI } from './utils/api';
import { AuthContext } from './Contexts/AuthContext';
import { API_URL as BACKEND_API_URL } from './utils/api';
import api from './utils/api';

const CURRENT_USERNAME = 'You';

const extractYouTubeId = (url) => {
  if (!url) return null;
  const reg =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(reg);
  return match && match[1] ? match[1] : null;
};

const LiveStreamScreen = () => {
  const { sessionId } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const room = `live-session:${sessionId}`;

  useEffect(() => {
    if (!sessionId) {
      setError('Missing live session reference');
      setLoading(false);
      return;
    }
    const fetchSession = async () => {
      try {
        const response = await liveSessionsAPI.getById(sessionId);
        if (response.success) {
          setSession(response.data);
        } else {
          setError(response.message || 'Unable to load session');
        }
      } catch (err) {
        console.error('Fetch live session error:', err);
        setError(err.response?.data?.message || 'Unable to load session');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) return;
      try {
        setChatLoading(true);
        const response = await api.get(`/live/${room}/messages`);
        setMessages(response.data || []);
      } catch (err) {
        console.error('Fetch live chat error:', err);
      } finally {
        setChatLoading(false);
      }
    };
    fetchMessages();
  }, [room, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const socket = io(BACKEND_API_URL, {
      transports: ['websocket'],
      path: '/socket.io',
    });
    socketRef.current = socket;
    socket.emit('join_live', { room });
    socket.on('live_message', (message) => {
      setMessages((prev) => [...prev, message]);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    });
    return () => {
      socket.off('live_message');
      socket.disconnect();
    };
  }, [room, sessionId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) {
      return;
    }
    socketRef.current.emit('live_message', {
      room,
      username: user?.name || CURRENT_USERNAME,
      message: newMessage.trim(),
    });
    setNewMessage('');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading live session...</Text>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Live session not found'}</Text>
      </View>
    );
  }

  const videoId = extractYouTubeId(session.youtubeUrl);
  const isLive = session.status === 'live';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <LinearGradient colors={['#1e67cd', '#4f83e0']} style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{session.courseTitle}</Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>
                    {session.status === 'live'
                      ? 'LIVE'
                      : session.status === 'scheduled'
                      ? 'SCHEDULED'
                      : 'ENDED'}
                  </Text>
                  <Text style={styles.viewerCount}>{session.courseCode}</Text>
                </View>
                <Text style={styles.instructorText}>
                  Lecturer: {session.lecturer}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.videoContainer}>
            {videoId ? (
              <YoutubePlayer
                height={250}
                play={isLive && isPlaying}
                videoId={videoId}
                onChangeState={(state) => {
                  if (state === 'ended') setIsPlaying(false);
                }}
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Ionicons name="play-circle" size={60} color="#fff" />
                <Text style={styles.videoPlaceholderText}>
                  Unable to load YouTube video
                </Text>
              </View>
            )}
            {!isLive && (
              <View style={styles.overlay}>
                <Ionicons name="time-outline" size={48} color="#fff" />
                <Text style={styles.overlayText}>
                  {session.status === 'scheduled'
                    ? 'Live session has not started'
                    : 'Live session has ended'}
                </Text>
                <Text style={styles.overlaySubtext}>
                  Scheduled for{' '}
                  {new Date(session.scheduledAt).toLocaleString() || 'TBD'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Live Chat</Text>
              <Text style={styles.commentsCount}>{messages.length} messages</Text>
            </View>
            {chatLoading ? (
              <View style={styles.chatLoading}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : (
              <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.commentsContent}
              >
                {messages.map((comment) => {
                  const isOwn =
                    comment.username === (user?.name || CURRENT_USERNAME);
                  return (
                    <View
                      key={comment.id || comment._id}
                      style={[
                        styles.bubble,
                        isOwn ? styles.bubbleOwn : styles.bubbleOther,
                      ]}
                    >
                      <View style={styles.bubbleHeader}>
                        {!isOwn && (
                          <Text
                            style={[
                              styles.bubbleUsername,
                              styles.bubbleUsernameOther,
                            ]}
                          >
                            {comment.username}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.bubbleTimestamp,
                            isOwn
                              ? styles.bubbleTimestampOwn
                              : styles.bubbleTimestampOther,
                          ]}
                        >
                          {new Date(comment.timestamp || comment.createdAt).toLocaleTimeString()}
                        </Text>
                      </View>
                      <Text
                        style={
                          isOwn ? styles.bubbleMessageOwn : styles.bubbleMessageOther
                        }
                      >
                        {comment.message}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Type your message..."
                placeholderTextColor="#9ca3af"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                editable={isLive}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  newMessage.trim() && isLive ? styles.sendButtonActive : null,
                ]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || !isLive}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={
                    newMessage.trim() && isLive ? '#ffffff' : '#9ca3af'
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
  },
  viewerCount: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
  instructorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#E5E7EB',
  },
  videoContainer: {
    height: 250,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    marginTop: 12,
    color: '#fff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  overlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  overlaySubtext: {
    color: '#E5E7EB',
    marginTop: 8,
  },
  commentsSection: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  commentsCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  commentsContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 6,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#1e67cd',
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  bubbleUsername: {
    fontSize: 12,
    fontWeight: '700',
  },
  bubbleUsernameOther: {
    color: '#1e67cd',
  },
  bubbleTimestamp: {
    fontSize: 11,
  },
  bubbleTimestampOwn: {
    color: '#E5E7EB',
  },
  bubbleTimestampOther: {
    color: '#9CA3AF',
  },
  bubbleMessageOwn: {
    fontSize: 13,
    lineHeight: 18,
    color: '#ffffff',
  },
  bubbleMessageOther: {
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 80,
    minHeight: 40,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#f8fafc',
  },
  sendButton: {
    backgroundColor: '#e5e7eb',
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
  },
  sendButtonActive: {
    backgroundColor: '#1e67cd',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
  },
  errorText: {
    marginTop: 12,
    color: '#EF4444',
    textAlign: 'center',
  },
  chatLoading: {
    paddingVertical: 16,
  },
});

export default LiveStreamScreen;