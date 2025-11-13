import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { questionsAPI, API_URL } from "./utils/api";

export default function PastQuestions() {
  const { school, dept, level, subject } = useLocalSearchParams();
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [groupedQuestions, setGroupedQuestions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch questions from backend
  useEffect(() => {
    fetchQuestions();
  }, [school, dept, level, subject]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching questions with filters:', { school, department: dept, level, subject });
      
      const response = await questionsAPI.getAll({
        school,
        department: dept,
        level,
        subject,
      });

      console.log('Questions API response:', response);

      if (response.success) {
        const questionsData = response.data || [];
        console.log('Questions data received:', questionsData.length, 'questions');
        setQuestions(questionsData);
        
        // Group questions by year
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
        
        setGroupedQuestions(sortedGrouped);
      } else {
        setError("Failed to load questions");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Failed to load questions. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestions();
  };

  // Open PDF link in device browser or PDF viewer app
  const openPDF = async (url) => {
    try {
      // Construct full URL if it's a relative path or contains localhost
      let fullUrl = url;
      if (url && (url.startsWith('/uploads/') || url.includes('localhost'))) {
        // Replace localhost with API_URL, or prepend API_URL for relative paths
        if (url.includes('localhost')) {
          // Extract just the path part after localhost:5000
          const pathMatch = url.match(/\/uploads\/.*$/);
          if (pathMatch) {
            fullUrl = `${API_URL}${pathMatch[0]}`;
          } else {
            fullUrl = url.replace(/http:\/\/localhost:5000/, API_URL);
          }
        } else {
          fullUrl = `${API_URL}${url}`;
        }
      }

      console.log('Opening PDF:', fullUrl);

      // Use PDF viewer instead of browser
      router.push({
        pathname: "/pdf-viewer",
        params: {
          pdfUrl: fullUrl,
          title: `${subject} - Past Question`,
        },
      });
    } catch (error) {
      console.error("Failed to open PDF:", error);
      Alert.alert("Error", "Something went wrong while opening the PDF.");
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
          openSolution(solution, question);
        } else {
          // Show solution selection
          const solutionOptions = solutions.map((sol, index) => ({
            text: `Solution ${index + 1}${sol.youtubeUrl ? ' (Video)' : ''}${sol.pdfUrl ? ' (PDF)' : ''}`,
            onPress: () => openSolution(sol, question),
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
  const openSolution = (solution, question) => {
    // Construct full PDF URL if it's a relative path or contains localhost
    let pdfUrl = solution.pdfUrl;
    if (pdfUrl) {
      if (pdfUrl.startsWith('/uploads/')) {
        pdfUrl = `${API_URL}${pdfUrl}`;
      } else if (pdfUrl.includes('localhost')) {
        // Replace localhost with API_URL
        const pathMatch = pdfUrl.match(/\/uploads\/.*$/);
        if (pathMatch) {
          pdfUrl = `${API_URL}${pathMatch[0]}`;
        } else {
          pdfUrl = pdfUrl.replace(/http:\/\/localhost:5000/, API_URL);
        }
      }
    }

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
      // Open PDF solution
      router.push({
        pathname: "/pdf-viewer",
        params: {
          pdfUrl: pdfUrl,
          title: `${subject} ${question.year} Solution`,
        },
      });
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
          {subject} - {level}, {dept}
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
          {subject} - {level}, {dept}
        </Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchQuestions}
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
          {subject} - {level}, {dept}
        </Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No questions available</Text>
          <Text style={styles.emptySubtext}>
            Questions for {subject} in {level}, {dept} will appear here
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
        {subject} - {level}, {dept}
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
                    onPress={() => openPDF(question.pdfUrl)}
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
