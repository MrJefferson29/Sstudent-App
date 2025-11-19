import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { coursesAPI, resolveAssetUrl } from "./utils/api";

export default function CourseList() {
  const { departmentId, departmentName, level } = useLocalSearchParams();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [departmentId, level]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await coursesAPI.getAll(departmentId, level);
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
        <View style={styles.header}>
          <Text style={styles.title}>Courses</Text>
        </View>
        <Text style={styles.subtitle}>
          {departmentName || "Department"} {level ? `- ${level}` : ""}
        </Text>
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
        <View style={styles.header}>
          <Text style={styles.title}>Courses</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>Courses</Text>
      </View>
      <Text style={styles.subtitle}>
        {departmentName || "Department"} {level ? `- ${level}` : ""}
      </Text>

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No courses available</Text>
          <Text style={styles.emptySubtext}>
            Courses for this department will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {courses.map((course) => (
            <TouchableOpacity
              key={course._id}
              style={styles.courseCard}
              onPress={() => handleCoursePress(course)}
            >
              {course.thumbnail?.url && (
                <Image
                  source={{ uri: resolveAssetUrl(course.thumbnail.url) }}
                  style={styles.thumbnail}
                />
              )}
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.title}</Text>
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
              <Ionicons name="chevron-forward" size={20} color="#999" />
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

