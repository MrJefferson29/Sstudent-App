import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { coursesAPI, resolveAssetUrl } from "./utils/api";
import { AuthContext } from "./Contexts/AuthContext";

export default function CoursesScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch courses for user's department if available, otherwise fetch all
      const departmentId = user?.department?._id || user?.department;
      const response = await coursesAPI.getAll(departmentId, null);
      if (response.success) {
        setCourses(response.data || []);
      } else {
        setError("Failed to load courses");
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const handleCoursePress = (course) => {
    router.push({
      pathname: "/course-chapters",
      params: {
        courseId: course._id,
        courseTitle: course.title,
      },
    });
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Courses</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Courses</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCourses}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Courses</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No courses available</Text>
          <Text style={styles.emptySubtext}>
            {user?.department
              ? "Courses for your department will appear here"
              : "Courses will appear here once they are added"}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {courses.map((course) => (
            <TouchableOpacity
              key={course._id}
              style={styles.courseCard}
              onPress={() => handleCoursePress(course)}
              activeOpacity={0.7}
            >
              {course.thumbnail?.url ? (
                <Image
                  source={{ uri: resolveAssetUrl(course.thumbnail.url) }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                  <Ionicons name="book-outline" size={32} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {course.title}
                </Text>
                {course.code && (
                  <Text style={styles.courseCode}>{course.code}</Text>
                )}
                {course.instructor && (
                  <Text style={styles.instructor}>
                    <Ionicons name="person-outline" size={14} color="#6B7280" />{" "}
                    {course.instructor}
                  </Text>
                )}
                {course.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {course.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 15 : 50,
    paddingBottom: 15,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#374151",
  },
  searchButton: {
    padding: 5,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  courseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: "#E5E7EB",
  },
  thumbnailPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  instructor: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
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