import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "./Contexts/AuthContext";
import { notificationsAPI, resolveAssetUrl } from "./utils/api";
import { Video } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("thumbnail"); // 'thumbnail' or 'video'
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Only admins can access this page.');
      router.back();
      return;
    }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }

      // Try cache first
      try {
        const cached = await AsyncStorage.getItem('notificationsData');
        if (cached && !isRefreshing) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed)) {
            setNotifications(parsed);
            setLoading(false);
          }
        }
      } catch (e) {
        console.log('Error reading cached notifications:', e);
      }

      const response = await notificationsAPI.getAll(50);
      if (response.success) {
        const data = response.data || [];
        setNotifications(data);
        await AsyncStorage.setItem('notificationsData', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia({
        uri: result.assets[0].uri,
        type: 'image',
        name: 'thumbnail.jpg',
      });
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia({
        uri: result.assets[0].uri,
        type: 'video',
        name: 'video.mp4',
      });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    if (!selectedMedia && !editingNotification) {
      Alert.alert('Validation Error', 'Please select a thumbnail or video');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('mediaType', mediaType);

      if (selectedMedia) {
        const fileUri = selectedMedia.uri;
        const fileName = selectedMedia.name || (mediaType === 'thumbnail' ? 'thumbnail.jpg' : 'video.mp4');
        const fileType = mediaType === 'thumbnail' 
          ? 'image/jpeg' 
          : 'video/mp4';

        formData.append('media', {
          uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
          type: fileType,
          name: fileName,
        });
      }

      if (editingNotification) {
        await notificationsAPI.update(editingNotification._id, formData);
        Alert.alert('Success', 'Notification updated successfully');
      } else {
        await notificationsAPI.create(formData);
        Alert.alert('Success', 'Notification created successfully');
      }

      // Reset form
      setTitle("");
      setDescription("");
      setMediaType("thumbnail");
      setSelectedMedia(null);
      setEditingNotification(null);
      setShowForm(false);
      
      // Refresh notifications
      fetchNotifications(true);
    } catch (err) {
      console.error('Error saving notification:', err);
      Alert.alert('Error', 'Failed to save notification. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setTitle(notification.title);
    setDescription(notification.description);
    setMediaType(notification.thumbnail?.url ? 'thumbnail' : 'video');
    setSelectedMedia(null);
    setShowForm(true);
  };

  const handleDelete = (notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationsAPI.delete(notification._id);
              Alert.alert('Success', 'Notification deleted successfully');
              fetchNotifications(true);
            } catch (err) {
              console.error('Error deleting notification:', err);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const cancelForm = () => {
    setTitle("");
    setDescription("");
    setMediaType("thumbnail");
    setSelectedMedia(null);
    setEditingNotification(null);
    setShowForm(false);
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Notifications</Text>
        <TouchableOpacity
          onPress={() => {
            cancelForm();
            setShowForm(!showForm);
          }}
        >
          <Ionicons
            name={showForm ? "close" : "add-circle"}
            size={24}
            color="#2563EB"
          />
        </TouchableOpacity>
      </View>

      {showForm && (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={styles.formTitle}>
            {editingNotification ? 'Edit Notification' : 'Create Notification'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#9CA3AF"
          />

          <View style={styles.mediaTypeContainer}>
            <Text style={styles.label}>Media Type:</Text>
            <View style={styles.mediaTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.mediaTypeButton,
                  mediaType === 'thumbnail' && styles.mediaTypeButtonActive,
                ]}
                onPress={() => {
                  setMediaType('thumbnail');
                  setSelectedMedia(null);
                }}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    mediaType === 'thumbnail' && styles.mediaTypeButtonTextActive,
                  ]}
                >
                  Thumbnail
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mediaTypeButton,
                  mediaType === 'video' && styles.mediaTypeButtonActive,
                ]}
                onPress={() => {
                  setMediaType('video');
                  setSelectedMedia(null);
                }}
              >
                <Text
                  style={[
                    styles.mediaTypeButtonText,
                    mediaType === 'video' && styles.mediaTypeButtonTextActive,
                  ]}
                >
                  Video
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {mediaType === 'thumbnail' ? (
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#2563EB" />
              <Text style={styles.mediaButtonText}>
                {selectedMedia ? 'Change Thumbnail' : 'Select Thumbnail'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.mediaButton} onPress={pickVideo}>
              <Ionicons name="videocam-outline" size={24} color="#2563EB" />
              <Text style={styles.mediaButtonText}>
                {selectedMedia ? 'Change Video' : 'Select Video'}
              </Text>
            </TouchableOpacity>
          )}

          {selectedMedia && (
            <View style={styles.previewContainer}>
              {selectedMedia.type === 'image' ? (
                <Image source={{ uri: selectedMedia.uri }} style={styles.preview} />
              ) : (
                <Video
                  source={{ uri: selectedMedia.uri }}
                  style={styles.preview}
                  useNativeControls
                  resizeMode="contain"
                />
              )}
            </View>
          )}

          {editingNotification && !selectedMedia && (
            <View style={styles.previewContainer}>
              {editingNotification.thumbnail?.url ? (
                <Image
                  source={{ uri: resolveAssetUrl(editingNotification.thumbnail.url) }}
                  style={styles.preview}
                />
              ) : editingNotification.video?.url ? (
                <Video
                  source={{ uri: resolveAssetUrl(editingNotification.video.url) }}
                  style={styles.preview}
                  useNativeControls
                  resizeMode="contain"
                />
              ) : null}
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={cancelForm}
              disabled={uploading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingNotification ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notifications.map((notification) => (
          <View key={notification._id} style={styles.notificationCard}>
            {notification.thumbnail?.url && (
              <Image
                source={{ uri: resolveAssetUrl(notification.thumbnail.url) }}
                style={styles.cardImage}
              />
            )}
            {notification.video?.url && (
              <View style={styles.cardVideoContainer}>
                <Video
                  source={{ uri: resolveAssetUrl(notification.video.url) }}
                  style={styles.cardVideo}
                  useNativeControls
                  resizeMode="contain"
                  shouldPlay={false}
                />
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{notification.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {notification.description}
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(notification)}
                >
                  <Ionicons name="pencil" size={18} color="#2563EB" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(notification)}
                >
                  <Ionicons name="trash" size={18} color="#EF4444" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 15 : 50,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    maxHeight: 600,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  mediaTypeContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  mediaTypeButtons: {
    flexDirection: "row",
    gap: 10,
  },
  mediaTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  mediaTypeButtonActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#2563EB",
  },
  mediaTypeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  mediaTypeButtonTextActive: {
    color: "#2563EB",
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  mediaButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
  },
  previewContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: 200,
  },
  cardVideoContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
  },
  cardVideo: {
    width: "100%",
    height: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  submitButton: {
    backgroundColor: "#2563EB",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  listContainer: {
    flex: 1,
  },
  notificationCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  deleteButtonText: {
    color: "#EF4444",
  },
});

