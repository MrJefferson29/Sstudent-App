import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
// Assuming AuthContext and profileAPI are defined elsewhere
import { AuthContext } from "../Contexts/AuthContext";
import { profileAPI, resolveAssetUrl } from "../utils/api";

// --- Custom Components ---

/**
 * Renders a single clickable menu item.
 */
const MenuItem = React.memo(({ title, iconName, iconColor, onPress, isDestructive = false }) => (
  <TouchableOpacity
    style={redesignStyles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={redesignStyles.menuItemLeft}>
      <View style={[redesignStyles.menuIconWrapper, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <Text style={[redesignStyles.menuItemText, isDestructive && { color: iconColor }]}>
        {title}
      </Text>
    </View>
    {!isDestructive && (
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    )}
  </TouchableOpacity>
));

/**
 * Renders a read-only profile detail item.
 */
const DetailItem = React.memo(({ label, value, iconName }) => (
  <View style={redesignStyles.detailItem}>
    <Ionicons name={iconName} size={18} color="#6B7280" style={redesignStyles.detailIcon} />
    <View style={redesignStyles.detailTextWrapper}>
      <Text style={redesignStyles.detailLabel}>{label}</Text>
      <Text style={redesignStyles.detailValue} numberOfLines={1}>{value || "Not set"}</Text>
    </View>
  </View>
));


// --- Main Screen Component ---

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching Logic (Simplified) ---

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profileResponse = await profileAPI.getProfile();

      if (profileResponse.success) {
        setProfileData(profileResponse.user);
        updateUser(profileResponse.user);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (user) setProfileData(user);
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Logout Handler ---

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  }, [logout, router]);

  // --- Derived/Display Values ---
  const displayUser = profileData || user;
  
  if (loading && !displayUser) {
    return (
      <View style={[redesignStyles.container, redesignStyles.centerContent]}>
        <StatusBar backgroundColor="#F3F4F6" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={redesignStyles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Fallback for profile image
  const profileImageUri =
    resolveAssetUrl(displayUser?.profilePicture) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUser?.name || "User")}&background=10B981&color=fff&size=200`; // New accent color

  return (
    <View style={redesignStyles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* --- 1. Profile Header (Flat & Clean) --- */}
        <View style={redesignStyles.header}>
          <Text style={redesignStyles.headerTitle}>My Profile</Text>
        </View>

        {/* --- 2. User Info Card --- */}
        <View style={redesignStyles.profileCard}>
            <View style={redesignStyles.avatarContainer}>
                <Image
                    source={{ uri: profileImageUri }}
                    style={redesignStyles.profileImage}
                />
                <TouchableOpacity
                    style={redesignStyles.editAvatarButton}
                    onPress={() => router.push("/edit-profile")}
                >
                    <Ionicons name="camera" size={18} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={redesignStyles.nameInfo}>
                <Text style={redesignStyles.profileName}>
                    {displayUser?.name || "User Name"}
                </Text>
                <Text style={redesignStyles.profileEmail}>
                    {displayUser?.email || "email@example.com"}
                </Text>
            </View>
        </View>

        {/* --- 3. Academic Details Card --- */}
        <View style={redesignStyles.section}>
            <Text style={redesignStyles.sectionTitle}>Academic Details</Text>
            <View style={redesignStyles.card}>
                <DetailItem label="Institution" value={displayUser?.school} iconName="school-outline" />
                <DetailItem label="Department" value={displayUser?.department} iconName="library-outline" />
                <DetailItem label="Student Level" value={displayUser?.level} iconName="layers-outline" />
                <TouchableOpacity 
                    style={redesignStyles.editDetailsButton}
                    onPress={() => router.push("/edit-profile")}
                >
                    <Text style={redesignStyles.editDetailsText}>Update Details</Text>
                    <Ionicons name="create-outline" size={18} color="#10B981" />
                </TouchableOpacity>
            </View>
        </View>
        
        {/* --- 4. Settings & Security --- */}
        <View style={redesignStyles.section}>
            <Text style={redesignStyles.sectionTitle}>Settings & Security</Text>
            <View style={redesignStyles.card}>
                <MenuItem
                    title="Change Password"
                    iconName="lock-closed-outline"
                    iconColor="#F59E0B"
                    onPress={() => router.push("/change-password")}
                />
                <MenuItem
                    title="Privacy & Data"
                    iconName="shield-checkmark-outline"
                    iconColor="#3B82F6"
                />
                <MenuItem
                    title="Notifications"
                    iconName="notifications-outline"
                    iconColor="#6366F1"
                />
            </View>
        </View>

        {/* --- 5. Support & Actions --- */}
        <View style={redesignStyles.section}>
            <Text style={redesignStyles.sectionTitle}>Support & Actions</Text>
            <View style={redesignStyles.card}>
                <MenuItem
                    title="Help Center"
                    iconName="help-circle-outline"
                    iconColor="#10B981"
                />
                <MenuItem
                    title="Send Feedback"
                    iconName="chatbox-ellipses-outline"
                    iconColor="#F97316"
                />
                <MenuItem
                    title="Log Out"
                    iconName="log-out-outline"
                    iconColor="#EF4444"
                    onPress={handleLogout}
                    isDestructive={true}
                />
            </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

// --- STYLES ---

const redesignStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F3F4F6", // Light gray background
  },
  centerContent: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#6B7280", fontSize: 14 },
  
// --- Header ---
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { 
    fontSize: 26, 
    fontWeight: "700", 
    color: "#1F2937",
  },
  
// --- Profile Card & Avatar ---
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    // Soft, modern shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 3, 
    borderColor: "#10B981", // Accent color border
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981', // Accent color
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameInfo: {
    flex: 1,
  },
  profileName: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: "#1F2937", 
    marginBottom: 2, 
  },
  profileEmail: { 
    fontSize: 14, 
    color: "#6B7280", 
    fontWeight: '500' 
  },

// --- Section & Card Styling ---
  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563', // Slightly muted title color
    marginBottom: 8,
  },
  card: { 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    // Consistent soft shadow for all cards
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 2, 
    overflow: 'hidden',
  },

// --- Detail Items (Read-only) ---
  detailItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailIcon: {
    marginRight: 15,
    width: 25,
    textAlign: 'center',
  },
  detailTextWrapper: { 
    flex: 1,
  },
  detailLabel: { 
    fontSize: 12, 
    color: "#9CA3AF", 
    fontWeight: "500",
  },
  detailValue: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#1F2937",
    marginTop: 1,
  },
  editDetailsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  editDetailsText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 15,
  },

// --- Menu Items (Clickable) ---
  menuItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1,
  },
  menuIconWrapper: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: 15,
  },
  menuItemText: { 
    fontSize: 16, 
    fontWeight: "500", 
    color: "#1F2937",
  },
});