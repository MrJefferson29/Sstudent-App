import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "./Contexts/AuthContext";
import { profileAPI, resolveAssetUrl } from "./utils/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    school: "",
    department: "",
    level: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        school: user.school || "",
        department: user.department || "",
        level: user.level || "",
      });
      if (user.profilePicture) {
        setProfileImage(resolveAssetUrl(user.profilePicture));
      }
    }
  }, [user]);

  const pickImage = async () => {
    try {
      setImageLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert("Error", "Name is required");
        return;
      }

      setLoading(true);

      const updateFormData = new FormData();
      updateFormData.append("name", formData.name);
      updateFormData.append("school", formData.school);
      updateFormData.append("department", formData.department);
      updateFormData.append("level", formData.level);

      // Add image if a new one was selected
      if (profileImage && profileImage.startsWith("file://")) {
        const filename = profileImage.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        updateFormData.append("image", {
          uri: profileImage,
          name: filename,
          type,
        });
      }

      const response = await profileAPI.updateProfile(updateFormData);

      if (response.success) {
        updateUser(response.user);
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const defaultImageUri =
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(formData.name || "User") +
    "&background=2563EB&color=fff&size=128";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: profileImage || defaultImageUri }}
            style={styles.profileImage}
          />
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={pickImage}
            disabled={imageLoading}
          >
            {imageLoading ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <>
                <Ionicons name="camera" size={20} color="#2563EB" />
                <Text style={styles.changeImageText}>Change Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter your name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>School</Text>
          <TextInput
            style={styles.input}
            value={formData.school}
            onChangeText={(text) => setFormData({ ...formData, school: text })}
            placeholder="Enter your school"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Department</Text>
          <TextInput
            style={styles.input}
            value={formData.department}
            onChangeText={(text) =>
              setFormData({ ...formData, department: text })
            }
            placeholder="Enter your department"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Level</Text>
          <TextInput
            style={styles.input}
            value={formData.level}
            onChangeText={(text) => setFormData({ ...formData, level: text })}
            placeholder="Enter your level"
            placeholderTextColor="#999"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  imageSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E5E7EB",
    marginBottom: 15,
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2563EB",
  },
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

