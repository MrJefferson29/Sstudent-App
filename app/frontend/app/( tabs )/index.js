import React, { useContext, useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  return (
    <View style={professionalStyles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Header */}
        <View style={professionalStyles.header}>
          <View>
            <Text style={professionalStyles.welcome}>Welcome back,</Text>
            <Text style={professionalStyles.homeTitle}>{user?.name?.split(" ")[0] || "User"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")}> 
            <Image source={{ uri: profileImageUri }} style={professionalStyles.profileImage} />
          </TouchableOpacity>
        </View>

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
      {hasThumbnail && (
        <Image 
          source={{ uri: resolveAssetUrl(notification.thumbnail.url) }} 
          style={professionalStyles.notificationImage}
        />
      )}
      {hasVideo && (
        <View style={professionalStyles.notificationVideoContainer}>
          <Video
            source={{ uri: resolveAssetUrl(notification.video.url) }}
            style={professionalStyles.notificationVideo}
            useNativeControls={false}
            resizeMode="cover"
            shouldPlay={false}
          />
          <View style={professionalStyles.playButtonOverlay}>
            <Ionicons name="play-circle" size={48} color="#fff" />
          </View>
        </View>
      )}
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
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC", 
    paddingTop: 50, 
    paddingHorizontal: SPACING
  },
  sectionContainer: {
    marginTop: 25,
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 20 
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
    borderColor: "#2563EB"
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
