import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions, // Used for calculating 3-column width
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../Contexts/AuthContext";
import { resolveAssetUrl } from "../utils/api";

const { width } = Dimensions.get('window');
const SPACING = 20;
const COLUMN_COUNT = 3;
// Calculate dynamic width for 3 cards per row
const CARD_WIDTH = (width - SPACING * 2 - (COLUMN_COUNT - 1) * 10) / COLUMN_COUNT; 

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // Fallback URL for better professionalism
  const profileImageUri =
    resolveAssetUrl(user?.profilePicture) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=1E3A8A&color=fff&size=128`; // Darker blue background

  return (
    <View style={professionalStyles.container}>
      <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }} // Add bottom padding for scroll comfort
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
        {/* Feature Cards (3-Column Grid) */}
        <View style={professionalStyles.sectionContainer}>
            <Text style={professionalStyles.sectionTitle}>Quick Actions</Text>
            <View style={professionalStyles.featureGrid}>
                <ActionCard icon="document-text-outline" label="Past Q&A" route="/school-select" />
                <ActionCard icon="school-outline" label="Scholarships" route="/scholarship" />
                <ActionCard icon="cart-outline" label="Market" route="market" />
                <ActionCard icon="construct-outline" label="Skills" route="/skill-courses" />
                <ActionCard icon="briefcase-outline" label="Internships" route="/internships" />
                <ActionCard icon="business-outline" label="Jobs" route="/jobs" />
            </View>
        </View>

        {/* Featured Sections (Emphasis on clean, subtle primary color card) */}
        <View style={professionalStyles.sectionContainer}>
            <Text style={professionalStyles.sectionTitle}>Key Highlights</Text>
            
            <TouchableOpacity onPress={() => router.push("voting")} style={professionalStyles.highlightCard} activeOpacity={0.8}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="how-to-vote" size={28} color="#fff" style={{ marginRight: 12 }} />
                    <View>
                        <Text style={professionalStyles.highlightTitle}>Student Elections</Text>
                        <Text style={professionalStyles.highlightSubtitle}>Voting for the student union president is ongoing.</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("courses")} style={professionalStyles.secondaryCard} activeOpacity={0.9}>
                <Ionicons name="library-outline" size={24} color="#1E293B" style={{ marginRight: 12 }} />
                <View>
                    <Text style={professionalStyles.secondaryTitle}>Study Courses Library</Text>
                    <Text style={professionalStyles.secondarySubtitle}>Browse and choose from various available courses.</Text>
                </View>
            </TouchableOpacity>
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
            
            <NotificationItem 
                icon="document-text-outline" 
                title="Deadline: Scholarship Application" 
                text="Submit before the end of this week." 
                iconColor="#EF4444" // Red for urgency
            />

            <NotificationItem 
                icon="campaign" 
                title="New Campus Contest" 
                text="Vote for Mr. & Miss UBa now." 
                iconColor="#3B82F6" // Blue for general news
                isMaterialIcon={true}
            />

        </View>
      </ScrollView>
    </View>
  );
}

// ==========================================================
// Reusable Components
// ==========================================================

function ActionCard({ icon, label, route }) {
  const router = useRouter();
  return (
    <TouchableOpacity 
        style={professionalStyles.actionCard} 
        onPress={() => router.push(route)}
        activeOpacity={0.8}
    >
      <Ionicons name={icon} size={28} color="#2563EB" />
      <Text style={professionalStyles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function NotificationItem({ icon, title, text, iconColor, isMaterialIcon }) {
    return (
        <View style={professionalStyles.notification}>
            <View style={[professionalStyles.iconWrapper, { backgroundColor: `${iconColor}20` }]}>
                {isMaterialIcon ? (
                    <MaterialIcons name={icon} size={20} color={iconColor} />
                ) : (
                    <Ionicons name={icon} size={20} color={iconColor} />
                )}
            </View>
            <View style={{ marginLeft: 12, flexShrink: 1 }}>
                <Text style={professionalStyles.notificationTitle}>{title}</Text>
                <Text style={professionalStyles.notificationText}>{text}</Text>
            </View>
        </View>
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
    paddingHorizontal: SPACING // Use SPACING constant
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
    fontWeight: "800", // Extra bold for emphasis
    color: "#0F172A" 
},
  welcome: { 
    fontSize: 16, 
    color: "#475569", 
    fontWeight: '500' // Better weight for subtext
},
  profileImage: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    borderWidth: 3, 
    borderColor: "#2563EB" // Accent color border
},
  
// --- Search Bar ---
  searchContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#FFFFFF", // White background for a cleaner look
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: '#E2E8F0', // Subtle border
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, 
    shadowRadius: 5, 
    elevation: 2, 
    marginTop: 10 
},
  searchBar: { 
    flex: 1, 
    fontSize: 16, 
    color: "#111827" 
},

// --- 3-Column Action Grid ---
  featureGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between", 
    marginTop: 10,
},
  actionCard: { 
    width: CARD_WIDTH, // Dynamic 3-column width
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
    fontSize: 12, // Smaller font for 3 columns
    fontWeight: "600", 
    color: "#1E293B", 
    textAlign: "center" ,
    paddingHorizontal: 5
},

// --- Featured/Highlight Cards ---
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#0F172A", 
    marginBottom: 12 
},
  highlightCard: { 
    backgroundColor: "#2563EB", 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 10,
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 6 
},
  highlightTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#FFFFFF" 
},
  highlightSubtitle: { 
    fontSize: 14, 
    color: "#D1D5DB", // Lighter white for contrast
    marginTop: 2 
},
  secondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9', // Light, subtle contrast background
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
},
  secondaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
},
  secondarySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
},

// --- Create CV Card ---
  cvCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#1E3A8A", // Darker, more serious blue
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
    color: "#A5B4FC", // Pale purple for high contrast/professional feel
    marginTop: 3 
},

// --- Notifications ---
  notification: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 8, 
    backgroundColor: "#FFFFFF", 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#E2E8F0" ,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
},
  iconWrapper: {
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
},
  notificationTitle: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#1E293B" 
},
  notificationText: { 
    fontSize: 13, 
    color: "#6B7280", 
    marginTop: 2 
},
});