"use client"

import { useState, useRef, useEffect } from "react"
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
    Dimensions,
    Keyboard,
    TouchableWithoutFeedback,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
// Socket.IO and Axios are no longer imported/used for the dummy chat
// import io from "socket.io-client"
// import axios from "axios"

const { height } = Dimensions.get("window")

interface Comment {
    id: string
    username: string
    message: string
    timestamp: string
    isVerified?: boolean
}

// Global variable for the current user's name for consistency
const CURRENT_USERNAME = "You";

// --- DUMMY DATA ---
const DUMMY_COMMENTS: Comment[] = [
    { id: '1', username: 'Instructor', message: 'Welcome everyone! Today we are diving into advanced React Native optimization techniques. Feel free to ask questions!', timestamp: new Date(Date.now() - 300000).toISOString(), isVerified: true },
    { id: '2', username: 'AlexC_Dev', message: 'Hello! Excited to learn. What\'s the best practice for memoization in large lists?', timestamp: new Date(Date.now() - 280000).toISOString() },
    { id: '3', username: 'DataNerd', message: 'Is using `useCallback` on event handlers still considered a performance win, or is it mostly for dependency stabilization?', timestamp: new Date(Date.now() - 250000).toISOString() },
    { id: '4', username: 'You', message: 'Great session so far! My main question is about fast refresh with external modules.', timestamp: new Date(Date.now() - 200000).toISOString() },
    { id: '5', username: 'Instructor', message: 'Good question! For memoization, focus on components with many children or expensive renders. `useCallback` is mainly for preventing unnecessary re-renders in child components that rely on referential equality.', timestamp: new Date(Date.now() - 150000).toISOString(), isVerified: true },
    { id: '6', username: 'AlexC_Dev', message: 'Makes sense. Thanks!', timestamp: new Date(Date.now() - 140000).toISOString() },
    { id: '7', username: 'TechGuru', message: 'Anyone else having issues with Hermes and certain polyfills?', timestamp: new Date(Date.now() - 100000).toISOString() },
    { id: '8', username: 'WebWizard', message: 'I found a bug in a recent build. Will this session be recorded for review later?', timestamp: new Date(Date.now() - 80000).toISOString() },
    { id: '9', username: 'Instructor', message: 'Yes, the session is being recorded and will be available in the course library by tomorrow morning!', timestamp: new Date(Date.now() - 50000).toISOString(), isVerified: true },
    { id: '10', username: 'You', message: 'Awesome, thanks for the info!', timestamp: new Date(Date.now() - 20000).toISOString() },
    { id: '11', username: 'AlexC_Dev', message: 'One more message to make sure the chat scrolls properly to the very end!', timestamp: new Date(Date.now() - 10000).toISOString() },
];
// --- END DUMMY DATA ---


const LiveStreamScreen = () => {
    const params = useLocalSearchParams();
    const courseTitle = typeof params.title === "string" ? params.title : "Live Session";
    const instructor = typeof params.instructor === "string" ? params.instructor : "Jane Doe";
    const time = typeof params.time === "string" ? params.time : undefined;
    
    const isLiveParam = typeof params.isLive === "string" ? params.isLive : "true";
    const isLiveFromRoute = isLiveParam === "true";
    
    // 1. Initialize with dummy data
    const [comments, setComments] = useState<Comment[]>(DUMMY_COMMENTS);
    const [newComment, setNewComment] = useState("");
    
    // 2. Retain dummy live status/count for header
    const [isLive, setIsLive] = useState(isLiveFromRoute);
    const [viewerCount, setViewerCount] = useState(247);
    
    const scrollViewRef = useRef<ScrollView>(null);
    
    // Format timestamps to human-friendly relative times
    const formatTimestamp = (ts: string | number | undefined) => {
        if (!ts) return 'now'
        if (typeof ts === 'string' && /ago|now/i.test(ts)) return ts
        let t: number = 0
        if (typeof ts === 'string') {
            const parsed = Date.parse(ts)
            t = Number.isNaN(parsed) ? Date.now() : parsed
        } else if (typeof ts === 'number') {
            t = ts
        }
        const now = Date.now()
        const diffSec = Math.max(0, Math.floor((now - t) / 1000))
        if (diffSec < 5) return 'now'
        if (diffSec < 60) return `${diffSec} sec ago`
        const diffMin = Math.floor(diffSec / 60)
        if (diffMin < 60) return `${diffMin} min ago`
        const diffHr = Math.floor(diffMin / 60)
        if (diffHr < 24) return `${diffHr} hr ago`
        const d = new Date(t)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const mm = months[d.getMonth()]
        const dd = d.getDate()
        const hh = d.getHours().toString().padStart(2, '0')
        const mi = d.getMinutes().toString().padStart(2, '0')
        return `${mm} ${dd}, ${hh}:${mi}`
    }


    // Auto-scroll to bottom when new comments arrive
    useEffect(() => {
        // Use a slight delay to ensure the keyboard has finished its transition and layout is complete
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100); 
    }, [comments])

    const handleSendComment = () => {
        const messageText = newComment.trim();
        if (messageText) {
            const payload: Comment = {
                id: Date.now().toString(),
                username: CURRENT_USERNAME, // Consistent local username
                message: messageText,
                timestamp: new Date().toISOString(),
            }
            // Only local echo (no socket emit)
            setComments((prev) => [...prev, payload])
            setNewComment("")
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} 
            >
                {/* Removed TouchableWithoutFeedback around the whole container 
                    as it dismisses the keyboard too aggressively on every tap */}
                <View style={styles.container}>
                    {/* Header */}
                    <LinearGradient colors={["#1e67cd", "#4f83e0"]} style={styles.header}>
                        <View style={styles.headerContent}>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerTitle}>{courseTitle}</Text>
                                <View style={styles.liveIndicator}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveText}>{isLive ? "LIVE" : (time || "SCHEDULED")}</Text>
                                    <Text style={styles.viewerCount}>{viewerCount} watching</Text>
                                </View>
                                {instructor && (
                                    <Text style={styles.instructorText}>Instructor: {instructor}</Text>
                                )}
                            </View>
                            <TouchableOpacity style={styles.shareButton}>
                                <Ionicons name="share-outline" size={24} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    {/* Video Player Area */}
                    <View style={styles.videoContainer}>
                        <View style={styles.videoPlaceholder}>
                            {/* Replace with actual Video component */}
                            <LinearGradient
                                colors={["rgba(30, 103, 205, 0.1)", "rgba(79, 131, 224, 0.1)"]}
                                style={styles.videoGradient}
                            >
                                <Ionicons name="play-circle" size={80} color="#1e67cd" />
                                <Text style={styles.videoText}>{isLive ? "Live Stream Placeholder" : "Scheduled Session"}</Text>
                            </LinearGradient>
                        </View>

                        {/* Video Controls Overlay */}
                        <View style={styles.videoControls}>
                            <TouchableOpacity style={styles.controlButton}>
                                <Ionicons name="volume-high" size={20} color="#ffffff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.controlButton}>
                                <Ionicons name="expand" size={20} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Comments Section */}
                    {/* This container now hosts the flex layout for the ScrollView and the Input */}
                    <View style={styles.commentsSection}> 
                        <View style={styles.commentsHeader}>
                            <Text style={styles.commentsTitle}>Live Chat (Local Demo)</Text>
                            <Text style={styles.commentsCount}>{comments.length} messages</Text>
                        </View>

                        <ScrollView
                            ref={scrollViewRef}
                            // FIX: Removed style={styles.commentsContainer} from here, 
                            // ensuring the internal contentContainerStyle is what matters for scrolling.
                            // The commentsContainer style is now applied to the parent View inside commentsSection
                            style={styles.commentsContentWrapper} 
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={styles.commentsContent}
                        >
                            {/* Wrap chat bubbles in a dismissable area for better UX */}
                            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                <View style={{ flexGrow: 1, justifyContent: 'flex-end' }}>
                                    {comments.map((comment) => {
                                        const isOwn = comment.username === CURRENT_USERNAME; // Check against consistent current username
                                        return (
                                            <View key={comment.id} style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                                                <View style={styles.bubbleHeader}>
                                                    {/* Only show username for other users */}
                                                    {!isOwn && (
                                                        <Text style={[styles.bubbleUsername, styles.bubbleUsernameOther]}>
                                                            {comment.username}
                                                            {comment.isVerified && (
                                                                <Ionicons name="checkmark-circle" size={14} color="#1e67cd" style={styles.verifiedIcon} />
                                                            )}
                                                        </Text>
                                                    )}
                                                    {/* FIX: Ensure timestamp color works on both backgrounds */}
                                                    <Text style={[styles.bubbleTimestamp, isOwn ? styles.bubbleTimestampOwn : styles.bubbleTimestampOther]}>
                                                        {formatTimestamp(comment.timestamp)}
                                                    </Text>
                                                </View>
                                                <Text style={isOwn ? styles.bubbleMessageOwn : styles.bubbleMessageOther}>
                                                    {comment.message}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </TouchableWithoutFeedback>
                        </ScrollView>

                        {/* Comment Input */}
                        <View style={styles.commentInputContainer}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Type your message..."
                                placeholderTextColor="#9ca3af"
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                                maxLength={200}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, newComment.trim() ? styles.sendButtonActive : null]}
                                onPress={handleSendComment}
                                disabled={!newComment.trim()}
                            >
                                <Ionicons name="send" size={20} color={newComment.trim() ? "#ffffff" : "#9ca3af"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    header: {
        paddingTop: 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerInfo: {
        flex: 1,
        alignItems: "flex-start", 
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#ffffff",
        marginBottom: 4,
    },
    liveIndicator: {
        flexDirection: "row",
        alignItems: "center",
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#ef4444",
        marginRight: 6,
    },
    liveText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#ffffff",
        marginRight: 8,
    },
    viewerCount: {
        fontSize: 12,
        color: "#ffffff",
        opacity: 0.8,
    },
    instructorText: {
        marginTop: 6,
        fontSize: 12,
        color: '#E5E7EB',
    },
    shareButton: {
        padding: 5,
    },
    videoContainer: {
        height: height * 0.35,
        backgroundColor: "#000000",
        position: "relative",
    },
    videoPlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    videoGradient: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    videoText: {
        fontSize: 16,
        color: "#1e67cd",
        marginTop: 10,
        fontWeight: "600",
    },
    videoControls: {
        position: "absolute",
        bottom: 15,
        right: 15,
        flexDirection: "row",
    },
    controlButton: {
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        padding: 8,
        borderRadius: 20,
        marginLeft: 10,
    },
    commentsSection: {
        flex: 1,
        backgroundColor: "#f8fafc",
        // FIX: Removed position: 'relative'
    },
    commentsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    commentsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#374151",
    },
    commentsCount: {
        fontSize: 12,
        color: "#6b7280",
    },
    // FIX: This style is now used on the ScrollView's parent View to define the boundary
    commentsContentWrapper: { 
        flex: 1,
    },
    commentsContent: {
        // FIX: Added flexGrow: 1 to ensure content pushes to top/bottom correctly
        flexGrow: 1, 
        paddingHorizontal: 20,
        paddingTop: 10, // Added slight top padding
        paddingBottom: 10,
    },
    bubble: {
        maxWidth: '80%',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginVertical: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    bubbleOwn: {
        alignSelf: 'flex-end',
        backgroundColor: '#1e67cd',
    },
    bubbleOther: {
        alignSelf: 'flex-start',
        backgroundColor: '#ffffff',
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
    verifiedIcon: {
        marginLeft: 4,
    },
    commentInputContainer: {
        // FIX: Removed absolute positioning here!
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 80,
        minHeight: 40, // Ensure minimum height is set
        fontSize: 14,
        color: "#374151",
        backgroundColor: "#f8fafc",
    },
    sendButton: {
        backgroundColor: "#e5e7eb",
        padding: 10,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        height: 40, // Match input min height for alignment
        width: 40,
    },
    sendButtonActive: {
        backgroundColor: "#1e67cd",
    },
})

export default LiveStreamScreen