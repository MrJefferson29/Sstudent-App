import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { departmentsAPI } from "./utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DepartmentSelect() {
  const { schoolId, schoolName } = useLocalSearchParams();
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, [schoolId]);

  const fetchDepartments = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
      setIsLoading(true);
      }
      setError(null);

      // Try cache first for instant load
      const cacheKey = `departments_${schoolId}`;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached && !isRefreshing) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed) && parsed.length >= 0) {
            setDepartments(parsed);
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.log("Error reading cached departments:", e);
      }

      // Fetch from network
      const response = await departmentsAPI.getAll(schoolId);
      if (response.success) {
        const data = response.data || [];
        setDepartments(data);
        // Cache the data
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
          console.log("Error caching departments:", e);
        }
      } else {
        setError("Failed to load departments");
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      // If network fails, try to use cached data
      const cacheKey = `departments_${schoolId}`;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed) && parsed.length >= 0) {
            setDepartments(parsed);
            setError(null);
          } else {
            setError("Failed to load departments. Please check your connection.");
          }
        } else {
          setError("Failed to load departments. Please try again.");
        }
      } catch (e) {
      setError("Failed to load departments. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Departments</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading departments...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Departments</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDepartments}>
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
        <Text style={styles.title}>Departments</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Select your department in {schoolName || "School"}
      </Text>

      {/* Department Options */}
      {departments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No departments available</Text>
          <Text style={styles.emptySubtext}>
            Departments for this school will appear here
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 20 }}>
          {departments.map((dept) => (
            <View key={dept._id} style={styles.departmentContainer}>
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/level-select",
                    params: {
                      schoolId,
                      schoolName,
                      departmentId: dept._id,
                      departmentName: dept.name,
                    },
                  })
                }
              >
                <Ionicons name="library-outline" size={24} color="#2563EB" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardText}>{dept.name}</Text>
                  {dept.description && (
                    <Text style={styles.cardSubtext} numberOfLines={1}>
                      {dept.description}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
              
              {/* Courses Button */}
              <TouchableOpacity
                style={styles.coursesButton}
                onPress={() =>
                  router.push({
                    pathname: "/course-list",
                    params: {
                      departmentId: dept._id,
                      departmentName: dept.name,
                    },
                  })
                }
              >
                <Ionicons name="book-outline" size={18} color="#16A34A" />
                <Text style={styles.coursesButtonText}>View Courses</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
  },
  subtitle: {
    marginTop: 15,
    fontSize: 16,
    color: "#555",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111",
  },
  cardSubtext: {
    fontSize: 12,
    color: "#666",
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
  departmentContainer: {
    marginBottom: 12,
  },
  coursesButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  coursesButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#16A34A",
    marginLeft: 6,
  },
});
