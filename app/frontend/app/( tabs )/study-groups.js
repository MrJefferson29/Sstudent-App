import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import axios from 'axios';
import io from 'socket.io-client';

// --- Message Bubble Component ---
const MessageBubble = React.memo(({ msg, myUsername }) => {
  // Use a fallback for user key consistency, although typically it's 'user' from the server
  const senderName = msg.user || msg.username || 'System'; 
  const isMyMessage = senderName === myUsername;
  
  return (
    <View 
      key={msg.id || msg._id || Math.random()} 
      style={[
        styles.message, 
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}
    >
      {/* Show username for other messages */}
      {!isMyMessage && <Text style={styles.user}>{senderName}:</Text>}
      
      {/* Style text based on who sent it */}
      <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
        {msg.text}
      </Text>
    </View>
  );
});

// --- Main Component ---
export default function StudyGroupsScreen() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const API_URL = useMemo(() => {
    const envUrl = Constants?.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
    if (envUrl) return envUrl;
    // Emulator-safe defaults
    if (Platform.OS === 'android') return 'https://uba-r875.onrender.com';
    // iOS simulator/mac or web fallback
    return 'https://ficedu-payment.onrender.com';
  }, []);

  const socketRef = useRef(null);
  const groupIdRef = useRef(null);
  const usernameRef = useRef('You');

  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      try {
        // 1) Get default group id
        const groupRes = await axios.get(`${API_URL}/study-groups/default`);
        const groupId = groupRes.data.groupId;
        groupIdRef.current = groupId;

        // 2) Fetch history
        const msgsRes = await axios.get(`${API_URL}/study-groups/${groupId}/messages?limit=50`);
        if (mounted) {
          setMessages(msgsRes.data.messages || []);
          setLoading(false);
        }

        // 3) Connect socket and join room
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

        socket.on('connect_error', (err) => {
          console.warn('Socket connect_error:', err?.message);
        });

        socket.on('message', (payload) => {
          // Use 'user' for consistency with historical messages, though payload might use 'username'
          const finalPayload = { ...payload, user: payload.user || payload.username }; 
          setMessages((prev) => [...prev, finalPayload]);
          // Auto-scroll to bottom
          scrollRef.current?.scrollToEnd({ animated: true });
        });

        socket.on('typing', ({ username }) => {
          if (username !== usernameRef.current) { // Don't show typing for self
            setTypingUser(username);
            setTimeout(() => setTypingUser(null), 1500);
          }
        });
      } catch (err) {
        console.error('Study group setup error:', err);
        if(mounted) setLoading(false);
      }
    };

    setup();
    return () => {
      mounted = false;
      socketRef.current?.disconnect();
    };
  }, [API_URL]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !groupIdRef.current) return;
    const socket = socketRef.current;
    
    // Payload to send to both socket and REST fallback
    const messagePayload = {
      groupId: groupIdRef.current,
      text,
      username: usernameRef.current,
    };

    if (socket && socket.connected) {
      socket.emit('message', messagePayload);
      setInputText('');
    } else {
      // Fallback: persist via REST and append locally
      axios
        .post(`${API_URL}/study-groups/${groupIdRef.current}/messages/public`, messagePayload)
        .then((res) => {
          const payload = res.data?.message || { 
            id: Date.now(), 
            user: usernameRef.current, // Use 'user' for local append to match structure
            text, 
            timestamp: new Date().toISOString() 
          };
          setMessages((prev) => [...prev, payload]);
          setInputText('');
          scrollRef.current?.scrollToEnd({ animated: true });
        })
        .catch((err) => {
          console.warn('REST send error:', err?.message);
        });
    }
  };

  const handleTyping = (value) => {
    setInputText(value);
    // Emit typing event only if text is not empty
    if (value.length > 0 && groupIdRef.current && socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', { groupId: groupIdRef.current, username: usernameRef.current });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#43cea2", "#3498DB"]} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>Study Group</Text>
        <Text style={styles.headerSubtitle}>Ask questions and get answers from fellow students</Text>
      </LinearGradient>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // Increased offset to account for header height
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} 
      >
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <Text style={{ color: '#636e72' }}>Loading messages...</Text>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id || msg._id || Math.random()} msg={msg} myUsername={usernameRef.current} />
            ))
          )}
          {typingUser && (
            <Text style={{ color: '#b2bec3', fontStyle: 'italic', marginTop: 6, marginBottom: 10 }}>{typingUser} is typing...</Text>
          )}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={handleTyping}
            placeholderTextColor="#b2bec3"
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={inputText.trim().length === 0}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    // Increased paddingTop to accommodate status bar area
    paddingTop: Constants.statusBarHeight + 10, 
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#e0f7fa',
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 80,
  },
  message: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    maxWidth: '85%',
  },
  myMessage: {
    backgroundColor: '#3498DB',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#dff9fb',
    alignSelf: 'flex-start',
  },
  user: {
    fontWeight: 'bold',
    color: '#636e72',
    marginBottom: 2,
  },
  myMessageText: { // Added specific text style for my messages
    color: '#fff', 
    fontSize: 15,
  },
  otherMessageText: { // Added specific text style for other messages
    color: '#2d3436', 
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 18,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1, // Added subtle separator
    borderColor: '#dfe6e9',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    color: '#222f3e',
  },
  sendButton: {
    backgroundColor: '#43cea2',
    borderRadius: 24,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});