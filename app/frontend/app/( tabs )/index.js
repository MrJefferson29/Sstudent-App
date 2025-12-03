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
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { AuthContext } from "../Contexts/AuthContext";
import { resolveAssetUrl, notificationsAPI } from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";

const { width } = Dimensions.get('window');
const SPACING = 20;
const COLUMN_COUNT = 3;
const CARD_WIDTH = (width - SPACING * 2 - (COLUMN_COUNT - 1) * 10) / COLUMN_COUNT;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const animatedValue = useRef(new Animated.Value(width)).current;
  const [textWidth, setTextWidth] = useState(0);

  const profileImageUri =
    resolveAssetUrl(user?.profilePicture) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=1E3A8A&color=fff&size=128`;

  const fetchNotifications = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoadingNotifications(true);
      }

      // Try cache first for instant load
      try {
        const cached = await AsyncStorage.getItem('notificationsData');
        if (cached && !isRefreshing) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed) && parsed.length >= 0) {
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
        // Cache the data
        try {
          await AsyncStorage.setItem('notificationsData', JSON.stringify(data));
        } catch (e) {
          console.log('Error caching notifications:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // If network fails, try to use cached data
      try {
        const cached = await AsyncStorage.getItem('notificationsData');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed) && parsed.length >= 0) {
            setNotifications(parsed);
          }
        }
      } catch (e) {
        // Ignore cache read errors
      }
    } finally {
      setLoadingNotifications(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (textWidth > 0) {
      // Reset the animated value back to the starting position (width)
      animatedValue.setValue(width);

      Animated.loop(
        Animated.timing(animatedValue, {
          // Animate from starting position (width) to end position (-textWidth)
          toValue: -textWidth,
          duration: 15000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [textWidth]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  return (
    <View style={professionalStyles.mainWrapper}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={professionalStyles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Header - Now has paddingHorizontal: SPACING */}
        <View style={professionalStyles.headerPadded}>
          <View>
            <Text style={professionalStyles.welcome}>Welcome back,</Text>
            <Text style={professionalStyles.homeTitle}>{user?.name?.split(" ")[0] || "User"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")}> 
            <Image source={{ uri: profileImageUri }} style={professionalStyles.profileImage} />
          </TouchableOpacity>
        </View>

        {/* Updated Full-Width Marquee Strip
            * fullWidthStrip uses marginHorizontal: -SPACING to break out of the content flow.
            * This works because it is now a direct child of the ScrollView/Container content.
        */}
        <LinearGradient
          colors={['#9925ebff', '#1E40AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={professionalStyles.fullWidthStrip}
        >
          <Animated.Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: 'white',
              textTransform: 'uppercase',
              transform: [{ translateX: animatedValue }],
              lineHeight: 40,
              alignSelf: 'center',
            }}
            onLayout={(event) => setTextWidth(event.nativeEvent.layout.width)}
          >
            Don't forget to vote for the school council elections.
            Don't forget to vote for the school council elections.
            Don't forget to vote for the school council elections.
          </Animated.Text>
          <View style={professionalStyles.alertBadge}>
            <Text style={professionalStyles.alertText}>ALERT!</Text>
          </View>
        </LinearGradient>

        {/* Padded Content Wrapper for all subsequent sections */}
        <View style={professionalStyles.contentPadded}>
            {/* Quick Actions (merged with Student Elections & Courses Library) */}
            <View style={professionalStyles.sectionContainer}>
                <Text style={professionalStyles.sectionTitle}>Quick Actions</Text>
                <View style={professionalStyles.featureGrid}>
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
            <TouchableOpacity onPress={() => router.push("/cv")} style={professionalStyles.cvCard} activeOpacity={0.9}>
                <Ionicons name="document-attach-outline" size={32} color="#fff" style={{ marginRight: 12 }} />
                <View>
                    <Text style={professionalStyles.cvTitle}>Build Your Professional CV</Text>
                    <Text style={professionalStyles.cvSubtitle}>Build a high-impact CV in minutes.</Text>
                </View>
            </TouchableOpacity>

            {/* Notifications */}
            <View style={professionalStyles.sectionContainer}>
                <Text style={professionalStyles.sectionTitle}>Notifications & Alerts</Text>

                {loadingNotifications && notifications.length === 0 ? (
                    <View style={professionalStyles.loadingContainer}>
                        <ActivityIndicator size="small" color="#2563EB" />
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={professionalStyles.emptyNotifications}>
                        <Ionicons name="notifications-outline" size={32} color="#9CA3AF" />
                        <Text style={professionalStyles.emptyText}>No notifications yet</Text>
                    </View>
                ) : (
                    notifications.map((notification) => (
                        <NotificationItem 
                            key={notification._id}
                            notification={notification}
                        />
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
  const iconColor = color || "#2563EB"; // Default accent color
  return (
    <TouchableOpacity 
      style={professionalStyles.actionCard} 
      onPress={() => router.push(route)}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={28} color={iconColor} />
      <Text style={[professionalStyles.actionText, { color: "#1E293B" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function NotificationItem({ notification }) {
  const router = useRouter();
  const hasThumbnail = notification.thumbnail && notification.thumbnail.url;
  const hasVideo = notification.video && notification.video.url;
  const iconColor = "#2563EB";

  const handlePress = () => {
    router.push({
      pathname: '/notification-detail',
      params: {
        notificationId: notification._id,
      },
    });
  };

  return (
    <TouchableOpacity 
      style={professionalStyles.notification}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={professionalStyles.notificationContent}>
        <View style={[professionalStyles.iconWrapper, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name="notifications" size={20} color={iconColor} />
        </View>
        <View style={{ marginLeft: 12, flexShrink: 1, flex: 1 }}>
          <Text style={professionalStyles.notificationTitle}>{notification.title}</Text>
          <Text style={professionalStyles.notificationText} numberOfLines={2}>{notification.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

// ==========================================================
// STYLES
// ==========================================================

const professionalStyles = StyleSheet.create({
  mainWrapper: { 
    flex: 1, 
    backgroundColor: "#F8FAFC", 
  },
  scrollViewContent: {
      paddingBottom: 40,
      paddingTop: 50, // Applied here to move content down from the status bar
  },
  contentPadded: {
    // This wrapper applies padding to all content below the Marquee strip
    paddingHorizontal: SPACING,
  },
  sectionContainer: {
    marginTop: 25,
  },
  headerPadded: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    // Header gets the padding to align content with the rest of the page
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
  homeTitle: { 
    fontSize: 17, 
    fontWeight: "800",
    color: "#0F172A" 
  },
  welcome: { 
    fontSize: 16, 
    color: "#475569", 
    fontWeight: '500'
  },
  profileImage: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    borderWidth: 3, 
    borderColor: "#255cd4ff"
  },
  fullWidthStrip: {
    height: 40,
    overflow: 'hidden',
    // This negative margin cancels out the SPACING applied by the surrounding padded element (ScrollView content)
    // NOTE: In this fixed layout, we rely on the parent (ScrollView) having no paddingHorizontal, but the Header/Content do.
    // Since the scrollview content is the only parent, we cancel out the contentPadded padding, by relying on the fact that
    // the ScrollView itself is full width.
    marginHorizontal: -SPACING,
    // To ensure it breaks out of the ScrollView if contentPadded were applied to the whole ScrollView,
    // we apply padding to the Header and a new wrapper (contentPadded) for everything below the strip.
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25, // Add space below the strip
  },
  alertBadge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#7324ceff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 5,
  },
  alertText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  featureGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between", 
    marginTop: 10,
  },
  actionCard: { 
    width: CARD_WIDTH,
    height: CARD_WIDTH + 10,
    backgroundColor: "#FFFFFF", 
    paddingVertical: 15,
    borderRadius: 16, 
    marginBottom: 10, 
    alignItems: "center", 
    justifyContent: 'center',
    borderWidth: 1, 
    borderColor: "#F1F5F9", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, 
    shadowRadius: 5, 
    elevation: 3,
  },
  actionText: { 
    marginTop: 8, 
    fontSize: 12, 
    fontWeight: "600", 
    color: "#1E293B", 
    textAlign: "center",
    paddingHorizontal: 5
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#0F172A", 
    marginBottom: 12 
  },
  cvCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#1E3A8A",
    padding: 25, 
    borderRadius: 16, 
    marginTop: 25,
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25, 
    shadowRadius: 8, 
    elevation: 8, 
  },
  cvTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#FFFFFF" 
  },
  cvSubtitle: { 
    fontSize: 14, 
    color: "#A5B4FC", 
    marginTop: 3 
  },
  notification: { 
    marginTop: 8, 
    backgroundColor: "#FFFFFF", 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  notificationImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  notificationVideoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    position: 'relative',
  },
  notificationVideo: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  notificationContent: {
    flexDirection: "row", 
    alignItems: "flex-start", 
    padding: 14,
    justifyContent: 'space-between',
  },
  iconWrapper: {
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  notificationTitle: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#1E293B",
    marginBottom: 4,
  },
  notificationText: { 
    fontSize: 13, 
    color: "#6B7280",
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  adminButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyNotifications: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
});