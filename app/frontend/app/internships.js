import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Linking, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { internshipsAPI, API_URL } from './utils/api';

// Dummy internship data (always displayed)
const dummyInternships = [
  {
    id: 'dummy-1',
    title: 'Software Engineering Intern',
    company: 'Tech Innovators',
    location: 'Remote',
    duration: '3 Months',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80',
    desc: 'Work on real-world projects and learn from experienced engineers.',
    applicationLink: 'https://www.jobleads.com/registration/99/jobs/en/global/Exclusive-Intern-Jobs%20%7C-Headhunters-are-looking-for-you/all/intern?utm_source=microsoft-ads_xx-search_XX__&utm_content=ALL|EN|XX_Intern-Jobs_search-jobsearch_70&utm_medium=sea-ad&utm_campaign=ALL|EN|XX&msclkid=286be4a0e42410ffa7cf8c76e580cedd',
    isDummy: true,
  },
  {
    id: 'dummy-2',
    title: 'Marketing Intern',
    company: 'Bright Minds',
    location: 'Lagos, Nigeria',
    duration: '6 Months',
    image: 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80',
    desc: 'Gain hands-on experience in digital marketing and branding.',
    applicationLink: 'https://www.jobleads.com/registration/99/jobs/en/global/Exclusive-Intern-Jobs%20%7C-Headhunters-are-looking-for-you/all/intern?utm_source=microsoft-ads_xx-search_XX__&utm_content=ALL|EN|XX_Intern-Jobs_search-jobsearch_70&utm_medium=sea-ad&utm_campaign=ALL|EN|XX&msclkid=286be4a0e42410ffa7cf8c76e580cedd',
    isDummy: true,
  },
  {
    id: 'dummy-3',
    title: 'Graphic Design Intern',
    company: 'Creative Studio',
    location: 'Remote',
    duration: '2 Months',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80',
    desc: 'Assist in creating visual content for social media and campaigns.',
    applicationLink: 'https://www.jobleads.com/registration/99/jobs/en/global/Exclusive-Intern-Jobs%20%7C-Headhunters-are-looking-for-you/all/intern?utm_source=microsoft-ads_xx-search_XX__&utm_content=ALL|EN|XX_Intern-Jobs_search-jobsearch_70&utm_medium=sea-ad&utm_campaign=ALL|EN|XX&msclkid=286be4a0e42410ffa7cf8c76e580cedd',
    isDummy: true,
  },
];

export default function InternshipsScreen() {
  const [backendInternships, setBackendInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      setLoading(true);

      const response = await internshipsAPI.getAll();

      if (response.success) {
        const internshipsData = response.data || [];
        // Transform backend data to match the expected format
        const transformedData = internshipsData.map(internship => ({
          id: internship._id,
          title: internship.title,
          company: internship.company,
          location: internship.location,
          duration: internship.duration,
          image: internship.image ? `${API_URL}${internship.image}` : null,
          desc: internship.description,
          applicationLink: internship.applicationLink,
          isDummy: false,
        }));
        setBackendInternships(transformedData);
      } else {
        setBackendInternships([]);
      }
    } catch (err) {
      console.error("Error fetching internships:", err);
      // Silently fail - dummy internships will still be shown
      setBackendInternships([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInternships();
  };

  // Combine backend internships (first) with dummy internships (last)
  const allInternships = [...backendInternships, ...dummyInternships];

  const handleApply = (internship) => {
    const link = internship.applicationLink;
    if (link) {
      Linking.openURL(link).catch(err => {
        console.error('Error opening URL:', err);
        Alert.alert('Error', 'Could not open the application link');
      });
    } else {
      Alert.alert('Error', 'No application link available');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#3498DB" barStyle="light-content" />
      <LinearGradient colors={["#3498DB", "#43cea2"]} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>Internship Opportunities</Text>
        <Text style={styles.headerSubtitle}>Kickstart your career with real experience</Text>
      </LinearGradient>
      
      {/* Show loading indicator only when initially loading */}
      {loading && !refreshing && backendInternships.length === 0 && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color="#3498DB" />
          <Text style={styles.loadingText}>Loading new internships...</Text>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {allInternships.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => handleApply(item)}
          >
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.image} />
            )}
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.company}>{item.company} • {item.location}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
              <View style={styles.row}>
                <Text style={styles.duration}>{item.duration}</Text>
                <View style={styles.applyButton}>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.applyText}>Apply</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: 25,
    paddingBottom: 10,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#e0f7fa',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: 120,
  },
  infoContainer: {
    padding: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  company: {
    fontSize: 13,
    color: '#3498DB',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 10,
    minHeight: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#43cea2',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  applyText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 15,
  },
});
