import React, { useState, useEffect } from "react";
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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { courseChaptersAPI, courseCommentsAPI, resolveAssetUrl } from "./utils/api";
import { WebView } from "react-native-webview";

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
  const [videoLoading, setVideoLoading] = useState(true);

  useEffect(() => {
    fetchChapters();
  }, [courseId]);

  useEffect(() => {
    if (selectedChapter) {
      fetchComments();
    }
  }, [selectedChapter]);

  const fetchChapters = async () => {
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
  };

  const fetchComments = async () => {
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
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChapters();
  };

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

  // Helper function to generate YouTube embed URL
  const getYouTubeEmbedUrl = (youtubeUrl) => {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&modestbranding=1&rel=0&showinfo=0&controls=1`;
  };

  const handleChapterPress = (chapter) => {
    if (chapter.youtubeUrl) {
      setSelectedChapter(chapter);
      setShowComments(true);
      setVideoLoading(true);
    } else {
      Alert.alert("No Video", "This chapter does not have a video yet.");
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedChapter) return;

    try {
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setShowComments(false)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>
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
        <View style={styles.videoContainer}>
          {/* YouTube Video Player */}
          {selectedChapter.youtubeUrl && (() => {
            const embedUrl = getYouTubeEmbedUrl(selectedChapter.youtubeUrl);
            if (!embedUrl) {
              return (
                <View style={styles.videoWrapper}>
                  <Text style={styles.errorText}>Invalid YouTube URL</Text>
                </View>
              );
            }
            return (
              <View style={styles.videoWrapper}>
                {videoLoading && (
                  <View style={styles.videoLoading}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading video...</Text>
                  </View>
                )}
                <WebView
                  source={{ uri: embedUrl }}
                  style={styles.video}
                  allowsFullscreenVideo={true}
                  mediaPlaybackRequiresUserAction={false}
                  onLoadStart={() => setVideoLoading(true)}
                  onLoadEnd={() => setVideoLoading(false)}
                  onError={() => {
                    setVideoLoading(false);
                    Alert.alert("Error", "Failed to load video");
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />
              </View>
            );
          })()}

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
                  No {isQuestion ? "questions" : "comments"} yet. Be the first!
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.commentsList}>
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
              </ScrollView>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    marginRight: 10,
  },
  closeButton: {
    marginLeft: "auto",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  chapterSection: {
    marginBottom: 20,
  },
  chapterCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  chapterInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  chapterDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  chapterDuration: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  subChaptersContainer: {
    marginLeft: 40,
    marginTop: 5,
  },
  subChapterCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginHorizontal: 20,
  },
  subChapterInfo: {
    flex: 1,
    marginLeft: 10,
  },
  subChapterTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  subChapterDuration: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  videoLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    zIndex: 1,
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 14,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    padding: 20,
  },
  chapterInfoSection: {
    backgroundColor: "#fff",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  chapterInfoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  chapterInfoDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  commentsSection: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  toggleButtonText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  toggleButtonTextActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
  commentInputContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  commentsLoading: {
    padding: 20,
    alignItems: "center",
  },
  noComments: {
    padding: 40,
    alignItems: "center",
  },
  noCommentsText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  commentsList: {
    flex: 1,
  },
  commentCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  commentHeader: {
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 6,
  },
  questionBadge: {
    fontSize: 10,
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  commentText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  repliesContainer: {
    marginTop: 12,
    marginLeft: 20,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: "#E5E7EB",
  },
  replyCard: {
    marginBottom: 8,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  replyText: {
    fontSize: 13,
    color: "#374151",
  },
});

