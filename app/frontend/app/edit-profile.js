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
import { profileAPI, resolveAssetUrl, schoolsAPI, departmentsAPI } from "./utils/api";

const LEVEL_OPTIONS = ["Level 100", "Level 200", "Level 300", "Level 400"];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    schoolId: "",
    departmentId: "",
    level: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [selecting, setSelecting] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // ---------------------------
  // Load user data into the form
  // ---------------------------
  useEffect(() => {
    if (!user) return;

    const schoolId =
      typeof user.school === "object" ? user.school?._id : user.school;

    const departmentId =
      typeof user.department === "object" ? user.department?._id : user.department;

    setFormData({
      name: user.name || "",
      schoolId: schoolId || "",
      departmentId: departmentId || "",
      level: user.level || "",
    });

    if (user.profilePicture) {
      setProfileImage(resolveAssetUrl(user.profilePicture));
    }
  }, [user]);

  // ---------------------------
  // Load schools (ONCE)
  // ---------------------------
  useEffect(() => {
    const loadSchools = async () => {
      try {
        setOptionsLoading(true);
        const response = await schoolsAPI.getAll();
        if (response.success) {
          setSchools(response.data || []);
        }
      } catch (err) {
        console.error("Error loading schools:", err);
      } finally {
        setOptionsLoading(false);
      }
    };

    loadSchools();
  }, []);

  // ---------------------------
  // Load departments WHEN school changes
  // ---------------------------
  useEffect(() => {
    if (!formData.schoolId) {
      setDepartments([]);
      return;
    }

    const loadDepartments = async () => {
      try {
        setOptionsLoading(true);
        const response = await departmentsAPI.getAll(formData.schoolId);
        if (response.success) {
          setDepartments(response.data || []);
        }
      } catch (err) {
        console.error("Error loading departments:", err);
      } finally {
        setOptionsLoading(false);
      }
    };

    loadDepartments();
  }, [formData.schoolId]);

  // Derived readable names
  const schoolName =
    schools.find((s) => s._id === formData.schoolId)?.name || "";

  const departmentName =
    departments.find((d) => d._id === formData.departmentId)?.name || "";

  // ---------------------------
  // Pick profile image
  // ---------------------------
  const pickImage = async () => {
    try {
      setImageLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick image.");
    } finally {
      setImageLoading(false);
    }
  };

  const toggleSelect = (type) => {
    setSelecting((prev) => (prev === type ? null : type));
  };

  // ---------------------------
  // Select School
  // ---------------------------
  const handleSelectSchool = (school) => {
    setFormData({
      ...formData,
      schoolId: school._id,
      departmentId: "",
    });
    setSelecting(null);
  };

  // ---------------------------
  // Select Department
  // ---------------------------
  const handleSelectDepartment = (department) => {
    setFormData({
      ...formData,
      departmentId: department._id,
    });
    setSelecting(null);
  };

  // ---------------------------
  // Submit form
  // ---------------------------
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    if (!formData.schoolId) {
      Alert.alert("Error", "Please select your school");
      return;
    }
    if (!formData.departmentId) {
      Alert.alert("Error", "Please select your department");
      return;
    }
    if (!formData.level) {
      Alert.alert("Error", "Please select your level");
      return;
    }

    try {
      setLoading(true);

      const updateFormData = new FormData();
      updateFormData.append("name", formData.name);
      updateFormData.append("school", formData.schoolId);
      updateFormData.append("department", formData.departmentId);
      updateFormData.append("level", formData.level);

      if (profileImage && profileImage.startsWith("file://")) {
        const filename = profileImage.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

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
        Alert.alert("Error", response.message || "Failed to update");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong while updating.");
      console.error(err);
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
      {/* Header */}
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

        {/* Name */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) =>
              setFormData({ ...formData, name: text })
            }
            placeholder="Enter your name"
            placeholderTextColor="#999"
          />

          {/* SCHOOL */}
          <Text style={styles.label}>School *</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => toggleSelect("school")}
          >
            <Text
              style={schoolName ? styles.selectValue : styles.selectPlaceholder}
            >
              {schoolName || "Tap to select your school"}
            </Text>
            <Ionicons
              name={selecting === "school" ? "chevron-up" : "chevron-down"}
              size={18}
              color="#6B7280"
            />
          </TouchableOpacity>

          {selecting === "school" && (
            <View style={styles.optionsList}>
              {optionsLoading ? (
                <View style={styles.optionsLoading}>
                  <ActivityIndicator size="small" color="#2563EB" />
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 180 }}>
                  {schools.map((school) => (
                    <TouchableOpacity
                      key={school._id}
                      style={styles.optionItem}
                      onPress={() => handleSelectSchool(school)}
                    >
                      <Text style={styles.optionLabel}>{school.name}</Text>
                      {formData.schoolId === school._id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#10B981"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* DEPARTMENT */}
          <Text style={styles.label}>Department *</Text>
          <TouchableOpacity
            style={[
              styles.selectInput,
              !formData.schoolId && styles.selectInputDisabled,
            ]}
            onPress={() =>
              formData.schoolId && toggleSelect("department")
            }
            disabled={!formData.schoolId}
          >
            <Text
              style={
                departmentName
                  ? styles.selectValue
                  : styles.selectPlaceholder
              }
            >
              {formData.schoolId
                ? departmentName || "Tap to select your department"
                : "Select a school first"}
            </Text>
            <Ionicons
              name={
                selecting === "department" ? "chevron-up" : "chevron-down"
              }
              size={18}
              color={formData.schoolId ? "#6B7280" : "#CBD5F5"}
            />
          </TouchableOpacity>

          {selecting === "department" && formData.schoolId && (
            <View style={styles.optionsList}>
              {optionsLoading ? (
                <View style={styles.optionsLoading}>
                  <ActivityIndicator size="small" color="#2563EB" />
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 180 }}>
                  {departments.map((department) => (
                    <TouchableOpacity
                      key={department._id}
                      style={styles.optionItem}
                      onPress={() => handleSelectDepartment(department)}
                    >
                      <Text style={styles.optionLabel}>
                        {department.name}
                      </Text>
                      {formData.departmentId === department._id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#10B981"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* LEVEL */}
          <Text style={styles.label}>Level *</Text>
          <View style={styles.levelOptions}>
            {LEVEL_OPTIONS.map((level) => {
              const active = formData.level === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelChip,
                    active && styles.levelChipActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, level }))
                  }
                >
                  <Text
                    style={[
                      styles.levelChipText,
                      active && styles.levelChipTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled,
          ]}
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

// ---------------------------
// STYLES (UNCHANGED)
// ---------------------------
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
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  selectInputDisabled: {
    opacity: 0.6,
  },
  selectValue: {
    fontSize: 16,
    color: "#111",
    flex: 1,
    marginRight: 10,
  },
  selectPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
    flex: 1,
    marginRight: 10,
  },
  optionsList: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
  },
  optionsLoading: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionLabel: {
    fontSize: 15,
    color: "#111827",
  },
  emptyOptionText: {
    padding: 12,
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
  levelOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  levelChipActive: {
    backgroundColor: "#2563EB",
  },
  levelChipText: {
    color: "#1F2937",
    fontWeight: "600",
  },
  levelChipTextActive: {
    color: "#fff",
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
