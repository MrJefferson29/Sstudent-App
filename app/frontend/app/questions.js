import React, { useMemo } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { questionsAPI, resolveAssetUrl } from "./utils/api";
import { useOptimizedFetch } from "./utils/useOptimizedFetch";

export default function PastQuestions() {
  const { departmentId, departmentName, level, subject } = useLocalSearchParams();
  const router = useRouter();

  // Optimized fetch with caching
  const { data: response, isLoading, error, refreshing, refresh } = useOptimizedFetch(
    async (signal) => {
      const result = await questionsAPI.getAll({
        department: departmentId,
        level,
        subject,
      }, signal);
      if (!result.success) {
        throw new Error(result.message || "Failed to load questions");
      }
      return result;
    },
    [departmentId, level, subject],
    {
      cacheDuration: 10 * 60 * 1000, // 10 minutes cache
      refetchOnMount: true, // Fetch in background to update cache
    }
  );

  // Memoize expensive grouping operation
  const groupedQuestions = useMemo(() => {
    if (!response?.data) return {};
    
    const questionsData = response.data || [];
    const grouped = {};
    
    questionsData.forEach((question) => {
      const year = question.year;
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(question);
    });
    
    // Sort years in descending order
    const sortedYears = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    const sortedGrouped = {};
    sortedYears.forEach((year) => {
      sortedGrouped[year] = grouped[year];
    });
    
    return sortedGrouped;
  }, [response?.data]);

  // Open PDF in the app's PDF viewer
  const openPDF = (questionObj) => {
    try {
      const fullUrl = resolveAssetUrl(questionObj.pdfUrl) || questionObj.pdfUrl;

      console.log('Opening PDF URL:', fullUrl);

      if (!fullUrl) {
        Alert.alert("Error", "PDF URL is not available");
        return;
      }

      // Navigate to PDF viewer component
      router.push({
        pathname: "/pdf-viewer",
        params: {
          pdfUrl: fullUrl,
          title: `${subject} - Past Question`,
          questionId: questionObj._id, // Pass question ID for signed URL fallback
        },
      });
    } catch (error) {
      console.error("Failed to open PDF:", error);
      Alert.alert(
        "PDF Access Error",
        "Unable to open the PDF. Please try again or contact support if the issue persists."
      );
    }
  };

  // Handle viewing solution
  const handleViewSolution = async (question) => {
    try {
      // Fetch solutions for this question
      const response = await questionsAPI.getById(question._id);
      
      if (response.success && response.data.solutions && response.data.solutions.length > 0) {
        const solutions = response.data.solutions;
        
        // If multiple solutions, show option to choose
        if (solutions.length === 1) {
          const solution = solutions[0];
          await openSolution(solution, question);
        } else {
          // Show solution selection
          const solutionOptions = solutions.map((sol, index) => ({
            text: `Solution ${index + 1}${sol.youtubeUrl ? ' (Video)' : ''}${sol.pdfUrl ? ' (PDF)' : ''}`,
            onPress: async () => await openSolution(sol, question),
          }));
          
          solutionOptions.push({ text: 'Cancel', style: 'cancel' });
          
          Alert.alert(
            'Select Solution',
            `Choose a solution for ${subject} ${question.year}:`,
            solutionOptions
          );
        }
      } else {
        Alert.alert("No Solutions", "No solutions available for this question yet.");
      }
    } catch (error) {
      console.error("Error fetching solutions:", error);
      Alert.alert("Error", "Failed to load solutions. Please try again.");
    }
  };

  // Open solution (YouTube or PDF)
  const openSolution = async (solution, question) => {
    // Construct full PDF URL if it's a relative path or contains localhost
    let pdfUrl = resolveAssetUrl(solution.pdfUrl);

    if (solution.youtubeUrl) {
      // Extract video ID from YouTube URL
      const videoIdMatch = solution.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (videoId) {
        router.push({
          pathname: "/video-details-two",
          params: {
            title: `${subject} ${question.year} Solution`,
            youtubeUrl: solution.youtubeUrl,
            videoId: videoId,
            pdfUrl: pdfUrl || null,
            questionId: question._id,
          },
        });
      } else {
        Alert.alert("Error", "Invalid YouTube URL");
      }
    } else if (pdfUrl) {
      // Open PDF solution in the app's PDF viewer
      try {
        console.log('Opening PDF solution:', pdfUrl);

        router.push({
          pathname: "/pdf-viewer",
          params: {
            pdfUrl: pdfUrl,
            title: `${subject} ${question.year} Solution`,
            questionId: question._id, // Pass question ID for signed URL fallback
          },
        });
      } catch (error) {
        console.error("Failed to open PDF solution:", error);
        Alert.alert(
          "PDF Solution Error",
          "Unable to open the PDF solution. Please try again or contact support."
        );
      }
    }
  };

  // Render loading state
  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Past Questions</Text>
        </View>
        <Text style={styles.subtitle}>
          {subject} - {level}, {departmentName || "Department"}
        </Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Past Questions</Text>
        </View>
        <Text style={styles.subtitle}>
          {subject} - {level}, {departmentName || "Department"}
        </Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error?.message || error || "Failed to load questions"}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render empty state
  if (Object.keys(groupedQuestions).length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Past Questions</Text>
        </View>
        <Text style={styles.subtitle}>
          {subject} - {level}, {departmentName || "Department"}
        </Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Past Questions</Text>
      </View>

      <Text style={styles.subtitle}>
        {subject} - {level}, {departmentName || "Department"}
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
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
                  {/* View PDF */}
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: "#16A34A" }]}
                    onPress={() => openPDF(question)}
                  >
                    <Ionicons name="document-text" size={16} color="#fff" />
                    <Text style={styles.buttonText}>View PDF</Text>
                  </TouchableOpacity>

                  {/* View Solution */}
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: "#2563EB" }]}
                    onPress={() => handleViewSolution(question)}
                  >
                    <Ionicons name="play-circle" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Solution</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
});
