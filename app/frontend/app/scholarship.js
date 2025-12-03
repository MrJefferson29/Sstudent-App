import React, { useState, useEffect, useContext, useCallback } from "react";
import { Linking, Alert } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "./Contexts/AuthContext";
import { scholarshipsAPI, resolveAssetUrl } from "./utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');
const SPACING = 20;

// Dummy scholarship data (always displayed)
const dummyScholarships = [
  {
    _id: 'dummy-1',
    organizationName: 'Tech Innovators Scholarship 2025',
    description: 'A full scholarship for students pursuing a career in technology and digital transformation. Funding provided by international partners.',
    location: 'Worldwide',
    websiteLink: 'https://www.scholarships.com/tech-innovators',
    isDummy: true,
  },
  {
    _id: 'dummy-2',
    organizationName: 'Environmental Studies Research Grant',
    description: 'Exclusive grant opportunity for master\'s and PhD students focused on climate change mitigation and sustainability research.',
    location: 'Cameroon Only',
    websiteLink: 'https://www.scholarships.com/environmental-grant',
    isDummy: true,
  },
];

// --- Reusable Component: Scholarship Card ---
const ScholarshipCard = ({ scholarship, onPress }) => {
  const imagesArray = Array.isArray(scholarship.images) ? scholarship.images : [];
  const scholarshipImageUri =
    !scholarship.isDummy && imagesArray.length > 0
      ? resolveAssetUrl(imagesArray[0])
      : null;

  return (
  <TouchableOpacity
    key={scholarship._id}
    style={redesignStyles.scholarshipCard}
    onPress={() => onPress(scholarship)}
    activeOpacity={0.8}
  >
    <View style={redesignStyles.cardImageWrapper}>
      {/* Image/Placeholder */}
      {scholarshipImageUri ? (
        <Image
          source={{ uri: scholarshipImageUri }}
          style={redesignStyles.scholarshipImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[redesignStyles.scholarshipImage, redesignStyles.noImagePlaceholder]}>
          <Ionicons name="school-outline" size={40} color="#9CA3AF" />
        </View>
      )}
      
      {/* Dummy Tag Overlay */}
      {scholarship.isDummy && (
        <View style={redesignStyles.dummyTag}>
          <Text style={redesignStyles.dummyTagText}>DEMO</Text>
        </View>
      )}
    </View>
    
    <View style={redesignStyles.scholarshipContent}>
        <Text style={redesignStyles.scholarshipTitle} numberOfLines={2}>{scholarship.organizationName}</Text>
        
        <View style={redesignStyles.scholarshipInfo}>
          <Ionicons name="location-outline" size={14} color="#06B6D4" />
          <Text style={redesignStyles.scholarshipLocation}>{scholarship.location}</Text>
        </View>

        <Text 
          style={redesignStyles.scholarshipDescription}
          numberOfLines={3}
        >
          {scholarship.description}
        </Text>

        {/* Action Button */}
        {scholarship.websiteLink && (
          <View style={redesignStyles.scholarshipButton}>
            <Text style={redesignStyles.scholarshipButtonText}>Apply Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#06B6D4" />
          </View>
        )}
    </View>
  </TouchableOpacity>
  );
};


// --- Main Screen Component ---
export default function ScholarshipsScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [backendScholarships, setBackendScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchScholarships = useCallback(async (isRefreshing = false) => {
    try {
      if (backendScholarships.length === 0 && !isRefreshing) {
        setLoading(true);
      }

      // Try cache first for instant load
      try {
        const cached = await AsyncStorage.getItem('scholarshipsData');
        if (cached && !isRefreshing && backendScholarships.length === 0) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed) && parsed.length >= 0) {
            setBackendScholarships(parsed);
            setLoading(false);
          }
        }
      } catch (e) {
        console.log('Error reading cached scholarships:', e);
      }

      // Fetch from network
      const response = await scholarshipsAPI.getAll();
      if (response.success) {
        const data = response.data || [];
        setBackendScholarships(data);
        // Cache the data
        try {
          await AsyncStorage.setItem('scholarshipsData', JSON.stringify(data));
        } catch (e) {
          console.log('Error caching scholarships:', e);
        }
      } else {
        setBackendScholarships([]);
      }
    } catch (err) {
      console.error("Error fetching scholarships:", err);
      // If network fails, try to use cached data
      if (backendScholarships.length === 0) {
        try {
          const cached = await AsyncStorage.getItem('scholarshipsData');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && Array.isArray(parsed) && parsed.length >= 0) {
              setBackendScholarships(parsed);
            }
          }
        } catch (e) {
          // Ignore cache read errors
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [backendScholarships.length]);

  useEffect(() => {
    fetchScholarships();
  }, [fetchScholarships]);

  const allScholarships = [...backendScholarships, ...dummyScholarships];

  const onRefresh = () => {
    setRefreshing(true);
    fetchScholarships(true);
  };

  const handleScholarshipPress = (scholarship) => {
    if (scholarship.websiteLink) {
      Linking.openURL(scholarship.websiteLink).catch(err => {
        console.error('Error opening URL:', err);
        Alert.alert('Error', 'Could not open the website link. Please check your browser.');
      });
    }
  };

  // Filter scholarships based on search query
  const filteredScholarships = allScholarships.filter(scholarship => {
    const query = searchQuery.toLowerCase();
    return (
      scholarship.organizationName?.toLowerCase().includes(query) ||
      scholarship.description?.toLowerCase().includes(query) ||
      scholarship.location?.toLowerCase().includes(query)
    );
  });
    
  // Profile Image for Header
  const profileImageUri =
    resolveAssetUrl(user?.profilePicture) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=06B6D4&color=fff&size=128`;


  return (
    <View style={redesignStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- Fixed Header/Search Area --- */}
      <View style={redesignStyles.fixedHeaderWrapper}>
        <View style={redesignStyles.header}>
          <View>
            <Text style={redesignStyles.welcome}>Find your next opportunity,</Text>
            <Text style={redesignStyles.homeTitle}>Scholarships</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Image
              source={{ uri: profileImageUri }}
              style={redesignStyles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Scrollable Content --- */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={redesignStyles.scrollContent}
        refreshControl={
          <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor="#06B6D4" // Teal tint
            />
        }
      >
        {/* Loader for initial fetch only */}
        {loading && !refreshing && backendScholarships.length === 0 && (
          <View style={redesignStyles.loadingIndicator}>
            <ActivityIndicator size="large" color="#06B6D4" />
            <Text style={redesignStyles.loadingText}>Loading new scholarships...</Text>
          </View>
        )}

        {/* Section Header (For the list below the search bar) */}
        <Text style={redesignStyles.sectionTitle}>
          {searchQuery ? `Search Results (${filteredScholarships.length})` : 'Featured Opportunities'}
        </Text>

        {/* Scholarships List */}
        {filteredScholarships.length === 0 ? (
          <View style={redesignStyles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color="#E5E7EB" />
            <Text style={redesignStyles.emptyText}>
              {searchQuery ? 'No scholarships found' : 'No opportunities available'}
            </Text>
            <Text style={redesignStyles.emptySubtext}>
              {searchQuery 
                ? 'Try adjusting your search terms.'
                : 'Pull down to refresh or check back later.'}
            </Text>
          </View>
        ) : (
          <View style={redesignStyles.scholarshipsList}>
            {filteredScholarships.map((scholarship) => (
              <ScholarshipCard 
                    key={scholarship._id}
                    scholarship={scholarship} 
                    onPress={handleScholarshipPress} 
                />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// --- STYLES ---

const redesignStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Very light background
  },
  
  // --- Fixed Header (Header + Search Bar) ---
  fixedHeaderWrapper: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingHorizontal: SPACING,
    // Shadow to make it float over the scroll view
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10, // Ensure it stays on top
    paddingBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  welcome: {
    fontSize: 16,
    color: "#4B5563",
    fontWeight: '500',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3, 
    borderColor: "#06B6D4" // Teal accent
  },
  // --- Scroll Content ---
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: SPACING, // Space between fixed header and first card
    paddingBottom: 40,
  },

  // --- Section Title ---
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 15,
  },

  // --- Loading / Empty States ---
  loadingIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    minHeight: 150,
  },
  loadingText: {
    marginTop: 12,
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  
  // --- Scholarship Card ---
  scholarshipsList: {
    // Removed extra top margin here, using scrollContent padding
  },
  scholarshipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15, // Prominent rounding
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  cardImageWrapper: {
    position: 'relative',
  },
  scholarshipImage: {
    width: '100%',
    height: 160, 
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagePlaceholder: {
    // already set in scholarshipImage
  },
  dummyTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#06B6D4', // Teal background for the badge
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    zIndex: 5,
  },
  dummyTagText: {
    color: '#fff', 
    fontSize: 12,
    fontWeight: '700',
  },
  scholarshipContent: {
    padding: 16,
  },
  scholarshipTitle: {
    fontSize: 18,
    fontWeight: "800", // Extra bold title
    color: "#1F2937",
    marginBottom: 8,
  },
  scholarshipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scholarshipLocation: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
    fontWeight: '600',
  },
  scholarshipDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  scholarshipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align left for a cleaner look
    paddingVertical: 5,
    // Removed borderTop, relying on layout space
  },
  scholarshipButtonText: {
    color: "#06B6D4",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 6,
  },
});