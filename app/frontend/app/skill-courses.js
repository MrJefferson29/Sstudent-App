import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Pressable,
  Image,
  Linking,
  RefreshControl,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { DrawerLayoutAndroid } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "./Contexts/AuthContext";
import { resolveAssetUrl } from "./utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Skills = () => {
  const { userToken, userEmail } = useContext(AuthContext);
  
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Try cache first for instant load
        const cached = await AsyncStorage.getItem("skillCourses");
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSkills(parsed);
            setLoading(false);
          }
        }
      } catch (e) {
        console.log("Error reading cached skill courses:", e);
      } finally {
        // Always attempt a background refresh
        fetchSkills(false, isMounted);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch skills from the backend
  const fetchSkills = async (isRefreshing = false, isMountedFlag = true) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);
      const response = await axios.post("https://ficedu-payment.onrender.com/courses/get-all");
      const data = response.data?.data || [];
      if (!isMountedFlag) return;

      setSkills(data);
      try {
        await AsyncStorage.setItem("skillCourses", JSON.stringify(data));
      } catch (e) {
        console.log("Error caching skill courses:", e);
      }
      if (!Array.isArray(data) || data.length === 0) {
        console.log("No skills/courses returned from remote service");
      }
    } catch (err) {
      console.error("Error fetching skills:", err);
      setError("Failed to load skills. Please try again.");
    } finally {
      if (!isRefreshing) {
        setLoading(false);
      }
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSkills(true, true);
    setRefreshing(false);
  };

  const handleCoursePress = (course) => {
    const courseId = course._id || course.id || course.courseId;
    if (!courseId) {
      Alert.alert("Unavailable", "Course identifier is missing. Please try another course.");
      return;
    }
    const heading = course.name || course.title || "Skill Course";
    router.push({
      pathname: "/chapters/[id]",
      params: {
        id: courseId,
        heading,
      },
    });
  };

  // Drawer layout with header
  const DrawerWithHeader = ({ children }) => {
    const drawerRef = useRef(null);

    const renderDrawerContent = () => (
      <View style={styles.drawerContent}>
        {/* Add your drawer menu items here */}
      </View>
    );

    // handlePress function is kept as it uses Linking, which is imported
    const handlePress = async (url) => {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open the URL: ${url}`);
      }
    };

    return (
      <DrawerLayoutAndroid
        ref={drawerRef}
        drawerWidth={250}
        drawerPosition="left"
        renderNavigationView={renderDrawerContent}
      >
        {children}
      </DrawerLayoutAndroid>
    );
  };

  if (loading) {
    // Replaced <Loading /> with existing ActivityIndicator
    return <ActivityIndicator size="large" color={theme.primary} style={styles.center} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <DrawerWithHeader>
      <View style={styles.contentContainer}>
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSkills}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {skills.length === 0 && !loading && !error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No skills available</Text>
            <Text style={styles.emptySubtext}>
              Skills will appear here once they are added by administrators
            </Text>
          </View>
        )}

        {/* Skills List with pull-to-refresh */}
        <FlatList
          data={skills}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleCoursePress(item)}>
              <View style={styles.courseWrapper}>
                {(() => {
                  const imageUri = item.thumbnail?.url || item.images?.[0];
                  if (imageUri) {
                    return (
                      <Image
                        source={{ uri: resolveAssetUrl(imageUri) || imageUri }}
                        style={styles.courseImage}
                      />
                    );
                  }
                  return (
                  <View style={[styles.courseImage, styles.placeholderImage]}>
                    <Ionicons name="construct-outline" size={48} color="#9CA3AF" />
                  </View>
                  );
                })()}
                <View style={styles.overlay}>
                  <Text style={styles.courseName}>{item.name}</Text>
                  {item.category && (
                    <Text style={styles.category}>{item.category}</Text>
                  )}
                </View>
              </View>
            </Pressable>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </View>
    </DrawerWithHeader>
  );
};

const theme = {
  primary: "#4287f5",
  secondary: "#f8f9fa",
  accent: "#FFD700",
  error: "#dc3545",
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: theme.error,
    fontSize: 16,
  },
  header: {
    backgroundColor: theme.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#575757",
    elevation: 3,
  },
  backButton: {
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  drawerContent: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  // Removed bannerBox, bannerContent, bannerTitle, bannerPrice styles
  courseWrapper: {
    marginVertical: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  courseImage: {
    width: "100%",
    height: 150,
  },
  placeholderImage: {
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  courseName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 3,
  },
  category: {
    fontSize: 14,
    color: theme.secondary,
  },
  contentContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  errorText: {
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

export default Skills;