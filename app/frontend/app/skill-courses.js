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
import { AuthContext } from "./Contexts/AuthContext"; // Adjust path if needed

const Skills = () => {
  // Retrieve user info (kept for general app context, but not used for access control)
  const { userToken, userEmail } = useContext(AuthContext);
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Removed paymentFound state
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only fetch courses; payment check logic is removed
    fetchCourses();
  }, []); // userEmail removed from dependency array

  // Removed checkPaymentStatus function

  // Fetch courses from the backend
  const fetchCourses = async () => {
    try {
      const response = await axios.post("https://ficedu-payment.onrender.com/courses/get-all");
      setCourses(response.data.data);
    } catch (err) {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh handler: only refreshes courses list
  const onRefresh = async () => {
    setRefreshing(true);
    // Only fetching courses, no payment check
    await fetchCourses(); 
    setRefreshing(false);
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
        {/* Payment banner removed here */}

        {/* Courses List with pull-to-refresh */}
        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                // Payment check and access denial removed. Course access is granted.
                router.push({
                  pathname: `/chapters/[id]`,
                  params: { id: item._id, heading: item.name },
                });
              }}
            >
              <View style={styles.courseWrapper}>
                <Image source={{ uri: item.images[0] }} style={styles.courseImage} />
                {/* Lock overlay removed */}
                <View style={styles.overlay}>
                  <Text style={styles.courseName}>{item.name}</Text>
                  <Text style={styles.category}>{item.category}</Text>
                </View>
              </View>
            </Pressable>
          )}
          // Adding a footer component that occupies 100 units of space
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
  // Removed lockOverlay style
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
});

export default Skills;