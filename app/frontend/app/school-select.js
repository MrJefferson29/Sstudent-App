import React, { useState, useEffect, useMemo } from "react";
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
import { schoolsAPI, concoursAPI } from "./utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SchoolSelect() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("school");
  const [isLoading, setIsLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [concours, setConcours] = useState([]);
  const [error, setError] = useState(null);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState("all");

  const fetchData = async (tab = activeTab, isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }
      setError(null);

      if (tab === "school") {
        // Try cache first for instant load
        try {
          const cached = await AsyncStorage.getItem("schoolsData");
          if (cached && !isRefreshing) {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
              setSchools(parsed);
              setIsLoading(false);
            }
          }
        } catch (e) {
          console.log("Error reading cached schools:", e);
        }

        // Fetch from network
        const response = await schoolsAPI.getAll();
        if (response.success) {
          const data = response.data || [];
          setSchools(data);
          // Cache the data
          try {
            await AsyncStorage.setItem("schoolsData", JSON.stringify(data));
          } catch (e) {
            console.log("Error caching schools:", e);
          }
        } else {
          setError("Failed to load schools");
        }
      } else {
        // Try cache first for concours
        try {
          const cachedConcours = await AsyncStorage.getItem("concoursData");
          const cachedSchools = await AsyncStorage.getItem("schoolsData");
          
          if (cachedConcours && !isRefreshing) {
            const parsed = JSON.parse(cachedConcours);
            if (parsed && Array.isArray(parsed) && parsed.length >= 0) {
              setConcours(parsed);
            }
          }
          
          if (cachedSchools && !isRefreshing) {
            const parsed = JSON.parse(cachedSchools);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
              setSchools(parsed);
            }
          }
          
          if ((cachedConcours || cachedSchools) && !isRefreshing) {
            setIsLoading(false);
          }
        } catch (e) {
          console.log("Error reading cached concours/schools:", e);
        }

        // Fetch from network
        const [concoursRes, schoolsRes] = await Promise.all([
          concoursAPI.getAll(),
          schools.length ? Promise.resolve({ success: true, data: schools }) : schoolsAPI.getAll(),
        ]);

        if (concoursRes.success) {
          const data = concoursRes.data || [];
          setConcours(data);
          // Cache concours data
          try {
            await AsyncStorage.setItem("concoursData", JSON.stringify(data));
          } catch (e) {
            console.log("Error caching concours:", e);
          }
        } else {
          setError("Failed to load concours");
        }

        if (schoolsRes.success) {
          const data = schoolsRes.data || [];
          setSchools(data);
          // Cache schools data
          try {
            await AsyncStorage.setItem("schoolsData", JSON.stringify(data));
          } catch (e) {
            console.log("Error caching schools:", e);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      // If network fails, try to use cached data
      if (tab === "school") {
        try {
          const cached = await AsyncStorage.getItem("schoolsData");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
              setSchools(parsed);
              setError(null);
            } else {
              setError("Failed to load data. Please check your connection.");
            }
          } else {
            setError("Failed to load data. Please try again later.");
          }
        } catch (e) {
          setError("Failed to load data. Please try again later.");
        }
      } else {
        setError("Failed to load data. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "concour") {
      setSelectedSchoolFilter("all");
    }
    fetchData(activeTab);
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

  const schoolFilterOptions = useMemo(() => {
    const map = new Map();
    concours.forEach((item) => {
      const schoolId = item?.department?.school?._id || item?.department?.school;
      const schoolName =
        item?.department?.school?.name ||
        schools.find((s) => s._id === schoolId)?.name ||
        "Unknown School";
      if (schoolId && !map.has(String(schoolId))) {
        map.set(String(schoolId), schoolName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [concours, schools]);

  const filteredConcours = useMemo(() => {
    if (selectedSchoolFilter === "all") return concours;
    return concours.filter((item) => {
      const schoolId = item?.department?.school?._id || item?.department?.school;
      return String(schoolId) === String(selectedSchoolFilter);
    });
  }, [concours, selectedSchoolFilter]);

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

  const renderConcoursSection = () => {
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
              fetchData("concour");
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!concours || concours.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No concours available.</Text>
          <Text style={styles.emptySubtext}>
            Administrators can upload concours from the dashboard.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.concoursSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedSchoolFilter === "all" && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSchoolFilter("all")}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSchoolFilter === "all" && styles.filterChipTextActive,
              ]}
            >
              All Schools
            </Text>
          </TouchableOpacity>
          {schoolFilterOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterChip,
                selectedSchoolFilter === option.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSchoolFilter(option.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSchoolFilter === option.id && styles.filterChipTextActive,
                ]}
              >
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.itemsSection}>
          {filteredConcours.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No concours for this school yet.</Text>
            </View>
          ) : (
            filteredConcours.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={[styles.card, styles.concourCard]}
                onPress={() => handleSelection(item)}
              >
                <Ionicons name="document-text-outline" size={24} color="#C026D3" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardText}>{item.title}</Text>
                  <Text style={styles.cardSubtext}>
                    {item.department?.school?.name || "School"} · {item.department?.name || "Department"}
                  </Text>
                  <Text style={styles.concourYear}>Year: {item.year}</Text>
                </View>
                <Ionicons name="open-outline" size={20} color="#999" />
              </TouchableOpacity>
            ))
          )}
        </View>
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
        {activeTab === "school" ? renderItemsList(schools) : renderConcoursSection()}
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
  emptySubtext: { fontSize: 14, color: "#939393", marginTop: 6, textAlign: "center" },
  filterScroll: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 10,
    backgroundColor: "#F7F7F7",
  },
  filterChipActive: {
    backgroundColor: "#1e67cd",
    borderColor: "#1e67cd",
  },
  filterChipText: {
    color: "#555",
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFF",
  },
  concourCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#C026D3",
  },
  concoursSection: {
    paddingBottom: 30,
  },
  concourYear: {
    marginTop: 6,
    color: "#6366F1",
    fontWeight: "600",
  },
});
