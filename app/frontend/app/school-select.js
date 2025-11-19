import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { schoolsAPI, concoursAPI, departmentsAPI } from "./utils/api";

export default function SchoolSelect() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("school");
  const [isLoading, setIsLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [concours, setConcours] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (activeTab === "school") {
        const response = await schoolsAPI.getAll();
        if (response.success) {
          setSchools(response.data || []);
        } else {
          setError("Failed to load schools");
        }
      } else {
        // Fetch concours - get all departments first, then fetch concours
        const deptResponse = await departmentsAPI.getAll();
        if (deptResponse.success && deptResponse.data.length > 0) {
          // Get unique concours from all departments
          const allConcours = [];
          for (const dept of deptResponse.data) {
            const concoursRes = await concoursAPI.getAll(dept._id);
            if (concoursRes.success && concoursRes.data) {
              allConcours.push(...concoursRes.data);
            }
          }
          // Group by title and year to avoid duplicates
          const uniqueConcours = Array.from(
            new Map(allConcours.map(c => [`${c.title}-${c.year}`, c])).values()
          );
          setConcours(uniqueConcours);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSelection = (item) => {
    if (activeTab === "school") {
      // Navigate to department-select screen with the selected school ID
      router.push(`/department-select?schoolId=${item._id}&schoolName=${encodeURIComponent(item.name)}`);
    } else if (activeTab === "concour") {
      // Navigate to concours viewer
      router.push({
        pathname: "/pdf-viewer",
        params: {
          pdfUrl: item.pdfUrl,
          title: `${item.title} - ${item.year}`,
        },
      });
    }
  };

  const renderItemsList = (items) => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e67cd" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              // Re-fetch
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!items || items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items available.</Text>
        </View>
      );
    }

    return (
      <View style={styles.itemsSection}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item._id || index}
            style={styles.card}
            onPress={() => handleSelection(item)}
          >
            <Ionicons
              name={activeTab === "school" ? "school-outline" : "book-outline"}
              size={24}
              color="#2563EB"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardText}>
                {activeTab === "school" ? item.name : `${item.title} (${item.year})`}
              </Text>
              {activeTab === "school" && item.location && (
                <Text style={styles.cardSubtext}>{item.location}</Text>
              )}
              {activeTab === "concour" && item.department && (
                <Text style={styles.cardSubtext}>
                  {item.department.name || item.department}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#1e67cd", "#1e67cd"]}
        style={styles.header}
      >
    
        <Text style={styles.headerTitle}>Select School / Concour</Text>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "school" && styles.activeTab]}
          onPress={() => setActiveTab("school")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "school" && styles.activeTabText,
            ]}
          >
            School
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "concour" && styles.activeTab]}
          onPress={() => setActiveTab("concour")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "concour" && styles.activeTabText,
            ]}
          >
            Concour
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Based on Active Tab */}
      <ScrollView style={styles.scrollView}>
        {activeTab === "school" ? renderItemsList(schools) : renderItemsList(concours)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFF" },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomColor: "#1e67cd" },
  tabText: { fontSize: 16, fontWeight: "600", color: "#666" },
  activeTabText: { color: "#1e67cd" },

  itemsSection: { padding: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  scrollView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#1e67cd",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: { fontSize: 16, color: "#666", textAlign: "center" },
});
