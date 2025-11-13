import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, Platform } from "react-native";
// Assuming you have 'expo-linear-gradient' installed
import { LinearGradient } from "expo-linear-gradient"; 
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// --- Local Asset Imports ---
// Assuming these paths resolve correctly in your project structure
import word1 from '../assets/images/word1.jpeg'
import word2 from '../assets/images/word2.jpeg'
import word3 from '../assets/images/word3.jpeg'
import word5 from '../assets/images/word5.jpeg'
// Removed unused imports: word4, word5

// --- Data (Simulating a real-time status where the first class is LIVE) ---
const liveClasses = [
  {
    id: 1,
    title: "Mathematics: Advanced Algebra",
    instructor: "Prof. John Doe",
    time: "LIVE NOW", // Status for featured class
    isLive: true,
    thumbnail: word2, // Using imported asset variable
  },
  {
    id: 2,
    title: "Physics: Mechanics & Motion",
    instructor: "Dr. Emily Smith",
    time: "Today, 5:00 PM",
    isLive: false,
    thumbnail: word5, // Using imported asset variable
  },
  {
    id: 3,
    title: "Chemistry: Organic Reactions",
    instructor: "Prof. David Lee",
    time: "Tomorrow, 2:00 PM",
    isLive: false,
    thumbnail: word1, // Using imported asset variable
  },
];

// --- Custom Components ---

// Component for the standard upcoming class list
const UpcomingClassCard = ({ cls, onPress }) => (
    <TouchableOpacity style={modernStyles.upcomingCard} activeOpacity={0.85} onPress={() => onPress?.(cls)}>
        <Image source={cls.thumbnail} style={modernStyles.upcomingThumbnail} />
        <View style={modernStyles.upcomingInfoContainer}>
            <Text style={modernStyles.upcomingTitle} numberOfLines={2}>{cls.title}</Text>
            <Text style={modernStyles.upcomingInstructor}>
                <Ionicons name="person-outline" size={12} color="#6b7280" /> {cls.instructor}
            </Text>
            <Text style={modernStyles.upcomingTime}>
                <Ionicons name="time-outline" size={12} color="#9CA3AF" /> {cls.time}
            </Text>
        </View>
        <LinearGradient 
            colors={["#1e67cd", "#4f83e0"]} // Primary Blue Gradient for Join
            style={modernStyles.upcomingJoinButton}
        >
            <Text style={modernStyles.upcomingJoinButtonText}>Details</Text>
        </LinearGradient>
    </TouchableOpacity>
);

// --- Main Screen Component ---
export default function LiveClassesScreen() {
    const router = useRouter();
    const featuredClass = liveClasses[0];
    const upcomingClasses = liveClasses.slice(1);

    const openLive = (cls) => {
        router.push({
            pathname: "/live",
            params: {
                id: String(cls.id),
                title: cls.title,
                instructor: cls.instructor,
                time: cls.time,
                // NOTE: Local assets cannot be directly passed via navigation params. 
                // We typically use their URI/path if they were bundled/downloaded, but for this demo, 
                // we'll pass a placeholder or remove it if not needed in the /live screen.
                // Assuming the /live screen will use the title/id to fetch the correct image/video.
                isLive: cls.isLive ? "true" : "false",
            },
        });
    };

  return (
    <View style={modernStyles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Fixed Header */}
      <View style={modernStyles.headerContainer}>
        <Text style={modernStyles.headerTitle}>Live Classes</Text>
        <TouchableOpacity style={modernStyles.searchButton}>
            <Ionicons name="search" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={modernStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* --- 1. Featured/Live Class Section --- */}
        {featuredClass && featuredClass.isLive && (
            <View style={modernStyles.featuredSection}>
                <Text style={modernStyles.sectionHeader}>🔥 Live Now</Text>
                <TouchableOpacity style={modernStyles.featuredCard} activeOpacity={0.9} onPress={() => openLive(featuredClass)}>
                    
                    {/* Thumbnail Image (Using imported asset) */}
                    <Image source={featuredClass.thumbnail} style={modernStyles.featuredThumbnail} />
                    
                    {/* Live Badge Overlay */}
                    <LinearGradient 
                        colors={["#ef4444", "#dc2626"]} // Consistent Red Gradient
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 0 }} 
                        style={modernStyles.liveBadge}
                    >
                        <Ionicons name="videocam" size={14} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={modernStyles.liveBadgeText}>LIVE</Text>
                    </LinearGradient>

                    {/* Info and CTA */}
                    <View style={modernStyles.featuredInfoOverlay}>
                        <Text style={modernStyles.featuredTitle} numberOfLines={2}>{featuredClass.title}</Text>
                        <Text style={modernStyles.featuredInstructor}>{featuredClass.instructor}</Text>
                        
                        <LinearGradient 
                            colors={["#1e67cd", "#4f83e0"]} // Primary Blue Gradient
                            style={modernStyles.watchButton}
                        >
                            <Ionicons name="play-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={modernStyles.watchButtonText}>Watch Now</Text>
                        </LinearGradient>
                    </View>
                </TouchableOpacity>
            </View>
        )}

        {/* --- 2. Upcoming Classes List --- */}
        {upcomingClasses.length > 0 && (
            <View style={modernStyles.upcomingSection}>
                <Text style={modernStyles.sectionHeader}>Upcoming Schedule</Text>
                {upcomingClasses.map((cls) => (
                    <UpcomingClassCard key={cls.id} cls={cls} onPress={openLive} />
                ))}
            </View>
        )}
        
      </ScrollView>
    </View>
  );
}

// --- Modernized Stylesheet ---
const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Lighter background consistent with chat
  },

// --- Header ---
    headerContainer: {
        paddingHorizontal: 10,
        // Adjusted padding for better fit below status bar
        paddingTop: Platform.OS === 'android' ? 15 : 50, 
        paddingBottom: 15,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700", // Adjusted weight
    color: "#374151", // Dark text color
  },
    searchButton: {
        padding: 5,
    },

// --- Scroll & Section Containers ---
  scrollContainer: {
    paddingBottom: 30,
    paddingHorizontal: 10,
  },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151', // Consistent text color
        marginBottom: 15,
        marginTop: 20,
    },
    
// --- Featured/Live Card ---
    featuredSection: {
        marginBottom: 10,
    },
    featuredCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        // Adjusted shadow for a softer look
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    featuredThumbnail: {
        width: '100%',
        height: 200, // Large, prominent image
        marginBottom: 0,
    },
    liveBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        
    },
    liveBadgeText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
    },
    featuredInfoOverlay: {
        padding: 15,
    },
    featuredTitle: {
        fontSize: 20,
        fontWeight: '700', // Adjusted weight
        color: '#374151', // Consistent text color
        marginBottom: 4,
    },
    featuredInstructor: {
        fontSize: 15,
        color: '#6b7280', // Secondary text color
        marginBottom: 15,
    },
    watchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    watchButtonText: {
        color: "#fff",
        fontWeight: "700", // Adjusted weight
        fontSize: 16,
    },

// --- Upcoming List Cards ---
    upcomingSection: {
        marginTop: 10,
    },
    upcomingCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 2,
        marginBottom: 15,
        // Adjusted shadow for lighter look
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        alignItems: "center",
        padding: 12, // Increased padding slightly
    },
    upcomingThumbnail: {
        width: 60,
        height: 60,
        borderRadius: 10,
        marginRight: 15,
        backgroundColor: '#E5E7EB',
    },
    upcomingInfoContainer: {
        flex: 1,
        marginRight: 10,
    },
    upcomingTitle: {
        fontSize: 15,
        fontWeight: "600", // Adjusted weight
        color: "#374151", // Consistent text color
        marginBottom: 2,
    },
    upcomingInstructor: {
        fontSize: 13,
        color: "#6b7280", // Secondary text color
        fontWeight: '500',
    },
    upcomingTime: {
        fontSize: 12,
        color: "#9CA3AF",
        marginTop: 4,
    },
    upcomingJoinButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    upcomingJoinButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
});