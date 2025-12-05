import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { questionsAPI, resolveAssetUrl } from "./utils/api";
import { useOptimizedFetch } from "./utils/useOptimizedFetch";
import YouTubeIframe from "react-native-youtube-iframe";

export default function PastQuestions() {
  const { departmentId, departmentName, level, subject } = useLocalSearchParams();
  const router = useRouter();

  const [showVideo, setShowVideo] = useState(false);
  const [currentSolution, setCurrentSolution] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [uploadingQuestion, setUploadingQuestion] = useState(false);

  // Optimized fetch with caching
  const { data: response, isLoading, error, refreshing, refresh } = useOptimizedFetch(
    async (signal) => {
      const result = await questionsAPI.getAll(
        {
          department: departmentId,
          level,
          subject,
        },
        signal
      );
      if (!result.success) throw new Error(result.message || "Failed to load questions");
      return result;
    },
    [departmentId, level, subject],
    {
      cacheDuration: 10 * 60 * 1000,
      refetchOnMount: true,
    }
  );

  const questionsData = response?.data || [];

  // Memoize grouped questions by year
  const groupedQuestions = useMemo(() => {
    if (!questionsData.length) return {};
    const grouped = {};
    questionsData.forEach((question) => {
      const year = question.year;
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(question);
    });

    const sortedYears = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a)
      .map(String);

    const sortedGrouped = {};
    sortedYears.forEach((year) => (sortedGrouped[year] = grouped[year]));
    return sortedGrouped;
  }, [questionsData]);

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const onStateChange = useCallback((state) => {
    if (state === "ended") setPlaying(false);
  }, []);

  const openPDF = (questionObj) => {
    const fullUrl = resolveAssetUrl(questionObj.pdfUrl) || questionObj.pdfUrl;
    if (!fullUrl) {
      Alert.alert("Error", "PDF URL is not available");
      return;
    }

    router.push({
      pathname: "/pdf-viewer",
      params: {
        pdfUrl: fullUrl,
        title: `${subject} - Past Question`,
        questionId: questionObj._id,
      },
    });
  };

  const openSolutionPdf = (solution, question) => {
    const pdfUrl = resolveAssetUrl(solution.pdfUrl);
    if (!pdfUrl) {
      Alert.alert("PDF Solution Error", "This solution does not include a PDF file.");
      return;
    }

    router.push({
      pathname: "/pdf-viewer",
      params: {
        pdfUrl,
        title: `${subject} ${question.year} Solution`,
        questionId: question._id,
      },
    });
  };

  const handleViewSolution = async (question) => {
    try {
      const res = await questionsAPI.getById(question._id);
      if (res.success && res.data.solutions?.length) {
        const solutions = res.data.solutions;
        if (solutions.length === 1) {
          openSolution(solutions[0], question);
        } else {
          const options = solutions.map((sol, idx) => ({
            text: `Solution ${idx + 1}${sol.youtubeUrl ? " (Video)" : ""}${sol.pdfUrl ? " (PDF)" : ""}`,
            onPress: () => openSolution(sol, question),
          }));
          options.push({ text: "Cancel", style: "cancel" });
          Alert.alert("Select Solution", `Choose a solution for ${subject} ${question.year}:`, options);
        }
      } else {
        Alert.alert("No Solutions", "No solutions available for this question yet.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load solutions. Please try again.");
    }
  };

  const openSolution = (solution, question) => {
    const videoId = extractYouTubeId(solution.youtubeUrl);
    if (solution.youtubeUrl && videoId) {
      setCurrentSolution({ ...solution, videoId, pdfUrl: resolveAssetUrl(solution.pdfUrl) || null });
      setCurrentQuestion(question);
      setShowVideo(true);
      setPlaying(true);
      return;
    }
    if (solution.pdfUrl) {
      openSolutionPdf(solution, question);
      return;
    }
    Alert.alert("Error", "This solution does not contain a playable video or PDF.");
  };

  const handleSubmitQuestion = async () => {
    if (!questionText.trim()) {
      Alert.alert("Empty Field", "Please type your question or comment.");
      return;
    }
    setUploadingQuestion(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulate
      Alert.alert("Thank you!", "Your question/comment has been submitted.");
      setQuestionText("");
    } catch {
      Alert.alert("Error", "Unable to submit your question. Please try again.");
    } finally {
      setUploadingQuestion(false);
    }
  };

  // Show YouTube solution
  if (showVideo && currentSolution && currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowVideo(false);
              setPlaying(false);
              setCurrentSolution(null);
              setCurrentQuestion(null);
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Solution Preview</Text>
        </View>

        <View style={styles.videoWrapper}>
          <YouTubeIframe
            videoId={currentSolution.videoId}
            height={250}
            play={playing}
            onChangeState={onStateChange}
          />
        </View>

        <View style={styles.solutionInfo}>
          <Text style={styles.cardTitle}>{subject}</Text>
          <Text style={styles.solutionMeta}>Year {currentQuestion.year}</Text>
          {currentSolution.pdfUrl ? (
            <TouchableOpacity style={styles.solutionPdfButton} onPress={() => openSolutionPdf(currentSolution, currentQuestion)}>
              <Ionicons name="document-text-outline" size={16} color="#fff" />
              <Text style={styles.solutionPdfButtonText}>Open Solution PDF</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.noPdfText}>No PDF attached for this solution.</Text>
          )}
        </View>

        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Questions & Comments</Text>
            </View>

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                multiline
                placeholder="Ask a question or leave a comment about this solution..."
                placeholderTextColor="#9CA3AF"
                value={questionText}
                onChangeText={setQuestionText}
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!questionText.trim() || uploadingQuestion) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitQuestion}
                disabled={!questionText.trim() || uploadingQuestion}
              >
                {uploadingQuestion ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Full-page loading
  if (isLoading && !questionsData.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>Past Questions</Text></View>
        <Text style={styles.subtitle}>{subject} - {level}, {departmentName || "Department"}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </View>
    );
  }

  // Full-page error (no cached data)
  if (error && !questionsData.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>Past Questions</Text></View>
        <Text style={styles.subtitle}>{subject} - {level}, {departmentName || "Department"}</Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error?.message || error || "Failed to load questions"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (!Object.keys(groupedQuestions).length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>Past Questions</Text></View>
        <Text style={styles.subtitle}>{subject} - {level}, {departmentName || "Department"}</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No questions available</Text>
          <Text style={styles.emptySubtext}>
            Questions for {subject} in {level}, {departmentName || "Department"} will appear here
          </Text>
        </View>
      </View>
    );
  }

  // Main content
  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Past Questions</Text></View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {Object.entries(groupedQuestions).map(([year, yearQuestions]) => (
          <View key={year} style={styles.yearSection}>
            <Text style={styles.yearHeader}>Year {year}</Text>
            {yearQuestions.map((question) => (
              <View key={question._id} style={styles.card}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="document-text-outline" size={28} color="#2563EB" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.cardTitle}>{subject}</Text>
                    <Text style={styles.cardSubtitle}>Year: {question.year}</Text>
                  </View>
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={[styles.button, { backgroundColor: "#16A34A" }]} onPress={() => openPDF(question)}>
                    <Ionicons name="document-text" size={16} color="#fff" />
                    <Text style={styles.buttonText}>View PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: "#2563EB" }]} onPress={() => handleViewSolution(question)}>
                    <Ionicons name="play-circle" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Solution</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Questions & Comments</Text>
          </View>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              multiline
              placeholder={`Ask anything about ${subject}, ${level}, ${departmentName || "Department"}...`}
              placeholderTextColor="#9CA3AF"
              value={questionText}
              onChangeText={setQuestionText}
            />
            <TouchableOpacity
              style={[styles.submitButton, (!questionText.trim() || uploadingQuestion) && styles.submitButtonDisabled]}
              onPress={handleSubmitQuestion}
              disabled={!questionText.trim() || uploadingQuestion}
            >
              {uploadingQuestion ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Styles remain unchanged (can reuse your previous styles)
const styles = StyleSheet.create({ 
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#E0F2FE",
    padding: 15,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#374151",
    marginTop: 3,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },
  yearSection: {
    marginBottom: 24,
  },
  yearHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    paddingHorizontal: 4,
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
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  videoWrapper: {
    width: "100%",
    backgroundColor: "#000",
    aspectRatio: 16 / 9,
    marginTop: 20,
    overflow: "hidden",
  },
  solutionInfo: {
    marginTop: 20,
  },
  solutionMeta: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  solutionPdfButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    borderRadius: 10,
  },
  solutionPdfButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
  noPdfText: {
    marginTop: 16,
    fontSize: 14,
    color: "#9CA3AF",
  },
  commentsSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  commentsHeader: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  commentInputContainer: {
    marginTop: 14,
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    gap: 10,
    elevation: 1,
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
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
 }); // Paste your existing styles here
