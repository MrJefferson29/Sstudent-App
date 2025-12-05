import React, { useContext, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing, // Added Easing for smoother marquee
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { AuthContext } from "../Contexts/AuthContext";
import { resolveAssetUrl, notificationsAPI } from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');
const SPACING = 20;
const COLUMN_COUNT = 3;
const CARD_WIDTH = (width - SPACING * 2 - (COLUMN_COUNT - 1) * 10) / COLUMN_COUNT;

// ==========================================================
// Marquee Component (IMPROVED)
// ==========================================================
const announcementText = 
  "Don't forget to vote for the school council elections. Council elections are coming up and the school is in need of your participation.";
const MarqueeComponent = ({ text }) => {
  const [textWidth, setTextWidth] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const spacer = "   •   "; // Adds space and a bullet between loops
  const fullText = text + spacer;

  useEffect(() => {
    if (textWidth > 0) {
      const duration = textWidth * 30; // Adjust speed: Higher number = Slower

      const startAnimation = () => {
        animatedValue.setValue(0);
        Animated.timing(animatedValue, {
          toValue: -textWidth, // Move exactly the width of one text instance
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            startAnimation();
          }
        });
      };

      startAnimation();
    }
    // Cleanup function to stop animation when component unmounts
    return () => animatedValue.stopAnimation();
  }, [textWidth, animatedValue]);

  return (
    <View style={styles.marqueeContainer}>
      <LinearGradient
        // Updated colors for a better look
        colors={['#7C3AED', '#2563EB']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.marqueeBackground}
      >
        {/* The Scrolling Content Container */}
        <View style={styles.marqueeContentContainer}>
          <Animated.View
            style={{
              flexDirection: 'row',
              transform: [{ translateX: animatedValue }],
            }}
          >
            {/* 1st copy: Measure its width with onLayout */}
            <View onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}>
              <Text style={styles.marqueeText}>{fullText}</Text>
            </View>
            {/* 2nd & 3rd copies: Ensure seamless loop and fill screen */}
            <Text style={styles.marqueeText}>{fullText}</Text>
            <Text style={styles.marqueeText}>{fullText}</Text>
          </Animated.View>
        </View>

        {/* The Alert Badge Overlay (Skewed for effect) */}
        <TouchableOpacity style={styles.badgeContainer} activeOpacity={0.9} onPress={() => console.log('Marquee Pressed')}>
          <View style={styles.badgeSkew} />
          <View style={styles.badgeContent}>
            <Ionicons name="megaphone" size={16} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>ALERT</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};


// ==========================================================
// Home Screen
// ==========================================================
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Marquee animation related states are now managed inside MarqueeComponent
  
  const profileImageUri =
    resolveAssetUrl(user?.profilePicture) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=1E3A8A&color=fff&size=128`;

  const fetchNotifications = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoadingNotifications(true);

      // Try cache first
      try {
        const cached = await AsyncStorage.getItem('notificationsData');
        if (cached && !isRefreshing) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed)) {
            setNotifications(parsed);
            setLoadingNotifications(false);
          }
        }
      } catch (e) {
        console.log('Error reading cached notifications:', e);
      }

      // Fetch from network
      const response = await notificationsAPI.getAll(10);
      if (response.success) {
        const data = response.data || [];
        setNotifications(data);
        try {
          await AsyncStorage.setItem('notificationsData', JSON.stringify(data));
        } catch (e) {
          console.log('Error caching notifications:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Fallback to cache
      try {
        const cached = await AsyncStorage.getItem('notificationsData');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed)) setNotifications(parsed);
        }
      } catch {}
    } finally {
      setLoadingNotifications(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Removed the Marquee useEffect hook, as it's now in MarqueeComponent
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  return (
    <View style={styles.mainWrapper}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.headerPadded}>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.homeTitle}>{user?.name?.split(" ")[0] || "User"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
          </TouchableOpacity>
        </View>

        {/* FAST SEAMLESS MARQUEE (Using the new component) */}
        <MarqueeComponent text={announcementText} />

        {/* Padded Content */}
        <View style={styles.contentPadded}>
          {/* Quick Actions */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.featureGrid}>
              <ActionCard icon="document-text-outline" label="Past Q&A" route="/school-select" />
              <ActionCard icon="school-outline" label="Scholarships" route="/scholarship" />
              <ActionCard icon="cart-outline" label="Market" route="market" />
              <ActionCard icon="construct-outline" label="Skills" route="/skill-courses" />
              <ActionCard icon="radio-outline" label="Live Sessions" route="/live-sessions" />
              <ActionCard icon="briefcase-outline" label="Internships" route="/internships" />
              <ActionCard icon="business-outline" label="Jobs" route="/jobs" />
              <ActionCard icon="people-outline" label="Student Elections" route="/voting" color="#2563EB" />
              <ActionCard icon="library-outline" label="Study Courses Library" route="/courses" color="#1E293B" />
            </View>
          </View>

          {/* Create CV */}
          <TouchableOpacity onPress={() => router.push("/cv")} style={styles.cvCard} activeOpacity={0.9}>
            <Ionicons name="document-attach-outline" size={32} color="#fff" style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.cvTitle}>Build Your Professional CV</Text>
              <Text style={styles.cvSubtitle}>Build a high-impact CV in minutes.</Text>
            </View>
          </TouchableOpacity>

          {/* Notifications */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Notifications & Alerts</Text>

            {loadingNotifications && notifications.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <Ionicons name="notifications-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <NotificationItem key={notification._id} notification={notification} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================================
// Reusable Components
// ==========================================================
function ActionCard({ icon, label, route, color }) {
  const router = useRouter();
  const iconColor = color || "#2563EB";
  return (
    <TouchableOpacity 
      style={styles.actionCard} 
      onPress={() => router.push(route)}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={28} color={iconColor} />
      <Text style={[styles.actionText, { color: "#1E293B" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function NotificationItem({ notification }) {
  const router = useRouter();
  const iconColor = "#2563EB";

  const handlePress = () => {
    router.push({
      pathname: '/notification-detail',
      params: { notificationId: notification._id },
    });
  };

  return (
    <TouchableOpacity style={styles.notification} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.notificationContent}>
        <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name="notifications" size={20} color={iconColor} />
        </View>
        <View style={{ marginLeft: 12, flexShrink: 1, flex: 1 }}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationText} numberOfLines={2}>{notification.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

// ==========================================================
// Styles (UPDATED MARQUEE STYLES)
// ==========================================================
const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollViewContent: { paddingBottom: 40, paddingTop: 50 },
  contentPadded: { paddingHorizontal: SPACING },
  sectionContainer: { marginTop: 25 },
  headerPadded: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: SPACING,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: SPACING,
  },
  homeTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  welcome: { fontSize: 16, color: "#475569", fontWeight: '500' },
  profileImage: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: "#255cd4ff" },
  
  // --- UPDATED MARQUEE STYLES ---
  marqueeContainer: {
    marginVertical: 15,
    marginHorizontal: 0, 
    height: 44,
    justifyContent: 'center',
    // Added shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  marqueeBackground: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  marqueeContentContainer: {
    flex: 1,
    overflow: 'hidden',
    marginLeft: 110, // Push text to start AFTER the badge
  },
  marqueeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingVertical: 12,
  },
  badgeContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 105, 
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSkew: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#C026D3', // Fuchsia color for contrast
    transform: [{ skewX: '-15deg' }], // Creates the slanted cut
    marginLeft: -10, // Hide the left slant off-screen
    borderRightWidth: 2,
    borderRightColor: '#FFFFFF40', // Slight highlight on the edge
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10, // Compensate for the skew positioning
  },
  badgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  // --- END UPDATED MARQUEE STYLES ---

  featureGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 10 },
  actionCard: { width: CARD_WIDTH, height: CARD_WIDTH + 10, backgroundColor: "#FFFFFF", paddingVertical: 15, borderRadius: 16, marginBottom: 10, alignItems: "center", justifyContent: 'center', borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 3 },
  actionText: { marginTop: 8, fontSize: 12, fontWeight: "600", color: "#1E293B", textAlign: "center", paddingHorizontal: 5 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
  cvCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E3A8A", padding: 25, borderRadius: 16, marginTop: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  cvTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  cvSubtitle: { fontSize: 14, color: "#A5B4FC", marginTop: 3 },
  notification: { marginTop: 8, backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1, overflow: 'hidden' },
  notificationContent: { flexDirection: "row", alignItems: "flex-start", padding: 14, justifyContent: 'space-between' },
  iconWrapper: { padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  notificationTitle: { fontSize: 15, fontWeight: "600", color: "#1E293B", marginBottom: 4 },
  notificationText: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  loadingContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyNotifications: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { marginTop: 8, fontSize: 14, color: '#9CA3AF' },
});