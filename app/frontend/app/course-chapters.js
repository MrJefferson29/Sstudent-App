import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
// Assuming 'utils/api' contains courseChaptersAPI, courseCommentsAPI, resolveAssetUrl
import { courseChaptersAPI, courseCommentsAPI, resolveAssetUrl } from "./utils/api";
import YouTubeIframe from 'react-native-youtube-iframe'; 

export default function CourseChapters() {
  const { courseId, courseTitle } = useLocalSearchParams();
  const router = useRouter();
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isQuestion, setIsQuestion] = useState(false);
  const [playing, setPlaying] = useState(false); 

  // --- Fetching Logic ---

  const fetchChapters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await courseChaptersAPI.getByCourse(courseId);
      if (response.success) {
        setChapters(response.data || []);
      } else {
        setError("Failed to load chapters");
      }
    } catch (err) {
      console.error("Error fetching chapters:", err);
      setError("Failed to load chapters. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [courseId]);

  const fetchComments = useCallback(async () => {
    if (!selectedChapter) return;
    try {
      setCommentsLoading(true);
      const response = await courseCommentsAPI.getByChapter(selectedChapter._id);
      if (response.success) {
        setComments(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  }, [selectedChapter]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  useEffect(() => {
    if (selectedChapter) {
      fetchComments();
    }
  }, [selectedChapter, fetchComments]); 

  const onRefresh = () => {
    setRefreshing(true);
    fetchChapters();
  };

  // --- Video/Interaction Logic ---

  // Helper function to extract YouTube video ID from URL
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleChapterPress = (chapter) => {
    if (chapter.youtubeUrl) {
      setSelectedChapter(chapter);
      setShowComments(true);
      setPlaying(true); 
    } else {
      Alert.alert("No Video", "This chapter does not have a video yet.");
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedChapter) return;

    try {
      setPlaying(false); 
      
      const response = await courseCommentsAPI.create({
        chapter: selectedChapter._id,
        text: newComment.trim(),
        isQuestion,
      });

      if (response.success) {
        setNewComment("");
        setIsQuestion(false);
        fetchComments();
      } else {
        Alert.alert("Error", "Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      Alert.alert("Error", "Failed to post comment. Please try again.");
    }
  };

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
      Alert.alert("Video finished!");
    }
  }, []);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{courseTitle || "Course Chapters"}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading chapters...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{courseTitle || "Course Chapters"}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChapters}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (showComments ? setShowComments(false) : router.back())} 
          style={styles.backButton}
        >
          <Ionicons 
            name={showComments ? "arrow-back" : "chevron-back"} 
            size={24} 
            color="#111827" 
          />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {showComments && selectedChapter
            ? selectedChapter.title
            : courseTitle || "Course Chapters"}
        </Text>
        {showComments && (
          <TouchableOpacity
            onPress={() => setShowComments(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        )}
      </View>

      {/* Chapters List View */}
      {!showComments ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {chapters.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No chapters available</Text>
            </View>
          ) : (
            chapters.map((chapter) => (
              <View key={chapter._id} style={styles.chapterSection}>
                <TouchableOpacity
                  style={styles.chapterCard}
                  onPress={() => handleChapterPress(chapter)}
                >
                  <Ionicons
                    name={chapter.youtubeUrl ? "play-circle" : "lock-closed"}
                    size={24}
                    color={chapter.youtubeUrl ? "#2563EB" : "#9CA3AF"}
                  />
                  <View style={styles.chapterInfo}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    {chapter.description && (
                      <Text style={styles.chapterDescription} numberOfLines={2}>
                        {chapter.description}
                      </Text>
                    )}
                    {chapter.duration > 0 && (
                      <Text style={styles.chapterDuration}>
                        {Math.floor(chapter.duration / 60)}:
                        {String(chapter.duration % 60).padStart(2, "0")}
                      </Text>
                    )}
                  </View>
                  {chapter.youtubeUrl && (
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  )}
                </TouchableOpacity>

                {/* Sub-chapters */}
                {chapter.subChapters && chapter.subChapters.length > 0 && (
                  <View style={styles.subChaptersContainer}>
                    {chapter.subChapters.map((subChapter) => (
                      <TouchableOpacity
                        key={subChapter._id}
                        style={styles.subChapterCard}
                        onPress={() => handleChapterPress(subChapter)}
                      >
                        <Ionicons
                          name={subChapter.youtubeUrl ? "play" : "lock-closed"}
                          size={20}
                          color={subChapter.youtubeUrl ? "#16A34A" : "#9CA3AF"}
                        />
                        <View style={styles.subChapterInfo}>
                          <Text style={styles.subChapterTitle}>
                            {subChapter.title}
                          </Text>
                          {subChapter.duration > 0 && (
                            <Text style={styles.subChapterDuration}>
                              {Math.floor(subChapter.duration / 60)}:
                              {String(subChapter.duration % 60).padStart(2, "0")}
                            </Text>
                          )}
                        </View>
                        {subChapter.youtubeUrl && (
                          <Ionicons name="chevron-forward" size={18} color="#999" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      ) : selectedChapter ? (
        // Video and Comments View (Reworked to ensure correct layout)
        <View style={styles.videoContainer}>
          {/* 1. Video Player (Fixed Height/Aspect Ratio) */}
          <View style={styles.videoWrapper}>
            <YouTubeIframe
              height={Platform.OS === 'ios' || Platform.OS === 'android' ? 250 : '100%'}
              play={playing}
              videoId={extractYouTubeId(selectedChapter.youtubeUrl)}
              onChangeState={onStateChange}
              webViewProps={{
                androidHardwareAccelerationDisabled: true,
              }}
            />
          </View>

          {/* 2. Scrollable Content (Chapter Info + Comments) */}
          <ScrollView 
            style={styles.contentScrollContainer} 
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Chapter Info */}
            <View style={styles.chapterInfoSection}>
                <Text style={styles.chapterInfoTitle}>{selectedChapter.title}</Text>
                {selectedChapter.description && (
                <Text style={styles.chapterInfoDescription}>
                    {selectedChapter.description}
                </Text>
                )}
            </View>

            {/* Comments/Q&A Section */}
            <View style={styles.commentsSection}>
                <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Questions & Comments</Text>
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setIsQuestion(!isQuestion)}
                >
                    <Ionicons
                    name={isQuestion ? "help-circle" : "chatbubble-outline"}
                    size={20}
                    color={isQuestion ? "#2563EB" : "#6B7280"}
                    />
                    <Text
                    style={[
                        styles.toggleButtonText,
                        isQuestion && styles.toggleButtonTextActive,
                    ]}
                    >
                    {isQuestion ? "Question" : "Comment"}
                    </Text>
                </TouchableOpacity>
                </View>

                {/* Comment Input */}
                <View style={styles.commentInputContainer}>
                <TextInput
                    style={styles.commentInput}
                    placeholder={
                    isQuestion
                        ? "Ask a question..."
                        : "Leave a comment..."
                    }
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                />
                <TouchableOpacity
                    style={[
                    styles.submitButton,
                    !newComment.trim() && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmitComment}
                    disabled={!newComment.trim()}
                >
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
                </View>

                {/* Comments List */}
                {commentsLoading ? (
                <View style={styles.commentsLoading}>
                    <ActivityIndicator size="small" color="#2563EB" />
                </View>
                ) : comments.length === 0 ? (
                <View style={styles.noComments}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.noCommentsText}>
                    No comments or questions yet. Be the first!
                    </Text>
                </View>
                ) : (
                <View style={styles.commentsListContainer}>
                    {comments.map((comment) => (
                    <View key={comment._id} style={styles.commentCard}>
                        <View style={styles.commentHeader}>
                        <View style={styles.commentAuthor}>
                            <Ionicons
                            name={comment.isQuestion ? "help-circle" : "chatbubble"}
                            size={16}
                            color={comment.isQuestion ? "#2563EB" : "#16A34A"}
                            />
                            <Text style={styles.commentAuthorName}>
                            {comment.user?.name || "Anonymous"}
                            </Text>
                            {comment.isQuestion && (
                            <Text style={styles.questionBadge}>Question</Text>
                            )}
                        </View>
                        </View>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        {comment.replies && comment.replies.length > 0 && (
                            <View style={styles.repliesContainer}>
                                {comment.replies.map((reply) => (
                                <View key={reply._id} style={styles.replyCard}>
                                    <Text style={styles.replyAuthor}>
                                    {reply.user?.name || "Anonymous"}
                                    </Text>
                                    <Text style={styles.replyText}>{reply.text}</Text>
                                </View>
                                ))}
                            </View>
                        )}
                    </View>
                    ))}
                </View>
                )}
            </View>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  /* ---------- HEADER ---------- */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 2,
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  closeButton: {
    padding: 6,
    marginLeft: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },

  /* ---------- LOADING / ERROR ---------- */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    color: "#EF4444",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 15,
  },

  /* ---------- EMPTY ---------- */
  emptyContainer: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },

  /* ---------- CHAPTER CARD ---------- */
  chapterSection: {
    marginBottom: 10,
  },
  chapterCard: {
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    gap: 10,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chapterInfo: { flex: 1 },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  chapterDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
    lineHeight: 18,
  },
  chapterDuration: {
    fontSize: 12,
    color: "#94A3B8",
  },

  /* ---------- SUB-CHAPTERS ---------- */
  subChaptersContainer: {
    marginTop: 4,
    marginLeft: 40,
  },
  subChapterCard: {
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
  },
  subChapterInfo: {
    flex: 1,
  },
  subChapterTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  subChapterDuration: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  /* ---------- VIDEO SECTION ---------- */
  videoContainer: {
    flex: 1,
  },
  videoWrapper: {
  width: "100%",
  backgroundColor: "#000",
  aspectRatio: 16 / 9,
},


  /* ---------- CHAPTER INFO UNDER VIDEO ---------- */
  chapterInfoSection: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chapterInfoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  chapterInfoDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
  },

  /* ---------- COMMENTS ---------- */
  commentsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },

  commentsHeader: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  toggleButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  toggleButtonTextActive: {
    color: "#2563EB",
    fontWeight: "600",
  },

  /* ---------- COMMENT INPUT ---------- */
  commentInputContainer: {
    marginTop: 14,
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    gap: 10,
    elevation: 2,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    minHeight: 45,
    maxHeight: 120,
    padding: 10,
    fontSize: 14,
    borderRadius: 8,
    borderColor: "#E5E7EB",
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },

  /* ---------- COMMENT LIST ---------- */
  commentsListContainer: {
    marginTop: 16,
  },
  commentCard: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    elevation: 1,
  },
  commentAuthor: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  commentAuthorName: {
    fontWeight: "600",
    color: "#1F2937",
    fontSize: 14,
  },
  questionBadge: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    borderRadius: 8,
    fontWeight: "600",
  },
  commentText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },

  /* ---------- REPLIES ---------- */
  repliesContainer: {
    marginTop: 10,
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: "#E5E7EB",
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  replyText: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
});
