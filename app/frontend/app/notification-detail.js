import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video } from "expo-av";
import { notificationsAPI, resolveAssetUrl } from "./utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const VIDEO_HEIGHT = width * 0.5625; // 16:9 aspect ratio

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { notificationId } = useLocalSearchParams();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchNotification();
  }, [notificationId]);

  const fetchNotification = async () => {
    try {
      setLoading(true);

      // Try cache first
      try {
        const cached = await AsyncStorage.getItem("notificationsData");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed)) {
            const found = parsed.find((n) => n._id === notificationId);
            if (found) {
              setNotification(found);
              setLoading(false);
            }
          }
        }
      } catch (e) {
        console.log("Error reading cached notification:", e);
      }

      // Fetch from network
      const response = await notificationsAPI.getById(notificationId);
      if (response.success) {
        setNotification(response.data);
        // Update cache
        try {
          const cached = await AsyncStorage.getItem("notificationsData");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed)) {
              const updated = parsed.map((n) =>
                n._id === notificationId ? response.data : n
              );
              await AsyncStorage.setItem("notificationsData", JSON.stringify(updated));
            }
          }
        } catch (e) {
          // Ignore cache update errors
        }
      }
    } catch (err) {
      console.error("Error fetching notification:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      </View>
    );
  }

  if (!notification) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Notification not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const hasThumbnail = notification.thumbnail && notification.thumbnail.url;
  const hasVideo = notification.video && notification.video.url;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* YouTube-style Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {notification.title}
        </Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Video/Image Player Area - YouTube Style */}
      <View style={styles.playerContainer}>
        {hasVideo ? (
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={{ uri: resolveAssetUrl(notification.video.url) }}
              style={styles.video}
              resizeMode="contain"
              shouldPlay={isPlaying}
              useNativeControls={true}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setIsPlaying(status.isPlaying);
                }
              }}
            />
          </View>
        ) : hasThumbnail ? (
          <Image
            source={{ uri: resolveAssetUrl(notification.thumbnail.url) }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}
      </View>

      {/* Content Area - YouTube Style */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{notification.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {new Date(notification.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.description}>{notification.description}</Text>
        </View>

        {/* Action Buttons - YouTube Style */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="thumbs-up-outline" size={22} color="#606060" />
            <Text style={styles.actionButtonText}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="thumbs-down-outline" size={22} color="#606060" />
            <Text style={styles.actionButtonText}>Dislike</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={22} color="#606060" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={22} color="#606060" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Creator Info Section */}
        <View style={styles.creatorSection}>
          <View style={styles.creatorAvatar}>
            <Ionicons name="notifications" size={24} color="#FF0000" />
          </View>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>System Notification</Text>
            <Text style={styles.creatorSubtext}>
              Official announcement from the platform
            </Text>
          </View>
          <TouchableOpacity style={styles.subscribeButton}>
            <Text style={styles.subscribeButtonText}>Subscribe</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Comments Section Placeholder */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Text style={styles.commentsCount}>0</Text>
          </View>
          <View style={styles.commentsPlaceholder}>
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text style={styles.commentsPlaceholderText}>
              No comments yet. Be the first to comment!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 50,
    paddingBottom: 12,
    backgroundColor: "#000",
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginHorizontal: 12,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#FF0000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  playerContainer: {
    width: "100%",
    backgroundColor: "#000",
  },
  videoWrapper: {
    width: "100%",
    height: VIDEO_HEIGHT,
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: VIDEO_HEIGHT,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  titleSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F0F0F",
    marginBottom: 8,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 14,
    color: "#606060",
  },
  descriptionSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F0F0F",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#606060",
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  actionButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: "#606060",
  },
  divider: {
    height: 8,
    backgroundColor: "#F1F1F1",
  },
  creatorSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F1F1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F0F0F",
    marginBottom: 4,
  },
  creatorSubtext: {
    fontSize: 12,
    color: "#606060",
  },
  subscribeButton: {
    backgroundColor: "#FF0000",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  commentsSection: {
    padding: 16,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F0F0F",
    marginRight: 8,
  },
  commentsCount: {
    fontSize: 14,
    color: "#606060",
  },
  commentsPlaceholder: {
    alignItems: "center",
    paddingVertical: 40,
  },
  commentsPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#606060",
    textAlign: "center",
  },
});

