import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Animated,
  Easing,
  Keyboard
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import axios from 'axios';
import { io } from 'socket.io-client';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AuthContext } from '../Contexts/AuthContext';

const { width } = Dimensions.get('window');

const darkColors = {
  primary: '#00B894',
  accent: '#74B9FF',
  accentLight: '#A3D9FF',
  error: '#FF6B6B',
  border: '#3A4750',
  background: '#1C2833',
  backgroundOverlay: 'rgba(0,0,0,0.7)',
  card: '#2E4053',
  textPrimary: '#ECF0F1',
  textSecondary: '#BDC3C7',
  textTertiary: '#7F8C8D',
  chatUser: '#00B894',
  chatBot: '#2E4053',
  chatSend: '#74B9FF',
  chatInput: '#3A4750',
  chatError: '#E74C3C',
  gradientPrimary: ['#1C2833', '#2E4053'],
};

const MessageBubble = React.memo(({ msg, myUsername, colors }) => {
  const senderName = msg.user || msg.username || 'System';
  // Normalize usernames for comparison (case-insensitive, trimmed)
  const normalizedSender = String(senderName).toLowerCase().trim();
  const normalizedMyUsername = String(myUsername).toLowerCase().trim();
  const isMyMessage = normalizedSender === normalizedMyUsername || normalizedSender === 'me';

  return (
    <View
      style={[
        styles.bubbleWrapper,
        isMyMessage ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMyMessage
            ? {
                backgroundColor: colors.chatUser,
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                borderBottomLeftRadius: 18,
                borderBottomRightRadius: 4,
              }
            : {
                backgroundColor: colors.chatBot,
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 18,
              },
        ]}
      >
        {!isMyMessage && (
          <Text style={[styles.user, { color: colors.primary }]}>{senderName}</Text>
        )}

        <Text style={[styles.bubbleText, { color: isMyMessage ? '#fff' : colors.textPrimary }]}>
          {msg.text}
        </Text>

        <View style={styles.bubbleFooter}>
          <Text
            style={[
              styles.bubbleTime,
              {
                color: isMyMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                textAlign: isMyMessage ? 'right' : 'left',
              },
            ]}
          >
            {msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </View>
  );
});

export default function StudyGroupsScreen() {
  const colors = darkColors;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMembers, setActiveMembers] = useState(0);

  const flatListRef = useRef(null);
  // Get username from user data (email, name, or fallback to 'Me')
  const usernameRef = useRef(
    user?.name || user?.email?.split('@')[0] || user?.username || 'Me'
  );
  const groupIdRef = useRef(null);
  const socketRef = useRef(null);
  const activeMembersRef = useRef(new Set());
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Update username when user changes
  useEffect(() => {
    usernameRef.current = user?.name || user?.email?.split('@')[0] || user?.username || 'Me';
  }, [user]);

  // API URL resolver
  const API_URL = useMemo(() => {
    const envUrl = Constants?.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
    if (envUrl) return envUrl;
    if (Platform.OS === 'android') return 'https://uba-r875.onrender.com';
    return 'https://ficedu-payment.onrender.com';
  }, []);

  // Setup socket + initial fetch
  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      try {
        // fetch default group id
        const groupRes = await axios.get(`${API_URL}/study-groups/default`);
        const groupId = groupRes.data.groupId;
        groupIdRef.current = groupId;

        // fetch messages
        const msgsRes = await axios.get(`${API_URL}/study-groups/${groupId}/messages?limit=50`);
        const fetchedMessages = msgsRes.data.messages || [];
        if (mounted) {
          activeMembersRef.current = new Set(
            fetchedMessages.map((item) => (item.user || item.username)).filter(Boolean)
          );
          setActiveMembers(Math.max(1, activeMembersRef.current.size));
          // ensure timestamps exist
          setMessages(
            fetchedMessages.map((m) => ({ ...m, timestamp: m.timestamp || new Date().toISOString() }))
          );
          setLoading(false);

          // Scroll to bottom after a small delay
          setTimeout(() => {
            tryScrollToEnd();
          }, 250);
        }

        // connect socket
        const socket = io(API_URL, {
          autoConnect: true,
          transports: ['polling', 'websocket'],
          path: '/socket.io',
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join', { groupId, username: usernameRef.current });
        });

        socket.on('message', (payload) => {
          const finalPayload = {
            ...payload,
            user: payload.user || payload.username,
            timestamp: payload.timestamp || new Date().toISOString(),
          };

          if (finalPayload.user) {
            const key = finalPayload.user.toString().toLowerCase();
            if (!activeMembersRef.current.has(key)) {
              activeMembersRef.current.add(key);
              setActiveMembers(activeMembersRef.current.size);
            }
          }

          // optimistic update from server
          setMessages((prev) => [...prev, finalPayload]);
          // quick fade (re-trigger)
          fadeAnim.setValue(0);
          Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true, easing: Easing.ease }).start();

          // scroll to end
          setTimeout(() => tryScrollToEnd(), 80);
        });

        socket.on('typing', ({ username }) => {
          if (username !== usernameRef.current) {
            setTypingUser(username);
            setTimeout(() => setTypingUser(null), 1500);
          }
        });
      } catch (err) {
        console.error('Study group setup error:', err);
        if (mounted) setLoading(false);
      }
    };

    setup();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
    };
  }, [API_URL, fadeAnim]);

  // When messages change, ensure scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      // animate subtle appearance
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true, easing: Easing.ease }).start();
      tryScrollToEnd();
    }
  }, [messages, fadeAnim]);

  // Attempt to scroll to end in a robust way
  const tryScrollToEnd = () => {
    // If FlatList exposes scrollToEnd (it should via ScrollView), call it. Otherwise use scrollToOffset.
    const fl = flatListRef.current;
    if (!fl) return;
    // Try scrollToEnd first:
    try {
      fl.scrollToEnd?.({ animated: true });
      // If scrollToEnd exists, done.
      return;
    } catch (e) {
      // ignore
    }
    // Fallback: measure content size by using scrollResponder
    try {
      fl.scrollToOffset?.({ offset: 99999, animated: true });
    } catch (e) {
      // last resort: no-op
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !groupIdRef.current) return;
    const socket = socketRef.current;
    const timestamp = new Date().toISOString();

    const messagePayload = {
      groupId: groupIdRef.current,
      text,
      username: usernameRef.current,
      timestamp,
    };

    // optimistic user message
    const userMsg = {
      id: Date.now(),
      user: usernameRef.current,
      text,
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    tryScrollToEnd();

    if (socket && socket.connected) {
      socket.emit('message', messagePayload);
    } else {
      axios.post(`${API_URL}/study-groups/${groupIdRef.current}/messages/public`, messagePayload).catch((err) => {
        console.warn('REST send error:', err?.message);
      });
    }
  };

  const handleTyping = (value) => {
    setInputText(value);
    if (value.length > 0 && groupIdRef.current && socketRef.current?.connected) {
      socketRef.current.emit('typing', { groupId: groupIdRef.current, username: usernameRef.current });
    }
  };

  // keep keyboard open behavior: when keyboard opens, scroll to end
  useEffect(() => {
    const onShow = () => tryScrollToEnd();
    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    return () => showSub.remove();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 10}
      >
        {/* Header */}
        <LinearGradient colors={colors.gradientPrimary} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.12)' }]} 
            onPress={() => router.push('/( tabs )/profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Study Group 📚</Text>
            <Text style={styles.headerSubtitle}>
              {activeMembers} Active Member{activeMembers !== 1 ? 's' : ''}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: colors.accent }]} 
            onPress={() => router.push('/( tabs )/profile')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-group" size={20} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Chat messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item, idx) => (item?.id?.toString ? item.id.toString() : String(idx))}
          renderItem={({ item }) => (
            <Animated.View style={{ opacity: fadeAnim }}>
              <MessageBubble msg={item} myUsername={usernameRef.current} colors={colors} />
            </Animated.View>
          )}
          contentContainerStyle={styles.flatListContentAdjusted}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() =>
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading chat history...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={50} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Start a conversation!</Text>
              </View>
            )
          }
          ListFooterComponent={() =>
            typingUser ? (
              <View style={[styles.typingIndicator, { backgroundColor: colors.card }]}>
                <Text style={[styles.typingText, { color: colors.textSecondary }]}>{typingUser} is typing...</Text>
              </View>
            ) : null
          }
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputWrapperFixed,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
              paddingBottom: insets.bottom || 12,
            },
          ]}
        >
          <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.chatInput,
                  borderColor: colors.border,
                },
              ]}
              value={inputText}
              onChangeText={handleTyping}
              placeholder="Type a message..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="center"
              autoCorrect
              blurOnSubmit={false}
              returnKeyType="default"
              numberOfLines={4}
              onFocus={() => tryScrollToEnd()}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={[
                styles.sendButton,
                { backgroundColor: colors.chatSend },
                !inputText.trim() && { opacity: 0.55 },
              ]}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  backButton: {
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: darkColors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  fab: {
    borderRadius: 24,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },


  // Chat list
  flatListContentAdjusted: {
    paddingVertical: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },

  // Bubble wrapper for proper alignment
  bubbleWrapper: {
    width: '100%',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  bubbleWrapperLeft: {
    alignItems: 'flex-start',
  },
  bubbleWrapperRight: {
    alignItems: 'flex-end',
  },
  // Bubble
  bubble: {
    maxWidth: '78%',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  user: {
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 13,
  },
  bubbleText: {
    fontSize: 16,
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
  },

  typingIndicator: {
    alignSelf: 'flex-start',
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 15,
    borderTopLeftRadius: 5,
    marginBottom: 10,
    maxWidth: '75%',
  },
  typingText: {
    fontStyle: 'italic',
    fontSize: 13,
  },

  // Input wrapper
  inputWrapperFixed: {
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: 25,
    borderWidth: 1,
    maxHeight: 120,
    minHeight: 46,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 25,
    height: 45,
    width: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
