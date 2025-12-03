import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const jobs = [
  {
    id: 1,
    title: 'Junior Accountant',
    company: 'FinServe Ltd.',
    location: 'Abuja, Nigeria',
    type: 'Full Time',
    image: 'https://images.unsplash.com/photo-1515168833906-d2a3b82b302b?auto=format&fit=crop&w=400&q=80',
    desc: 'Assist with financial records and reporting in a dynamic team.'
  },
  {
    id: 2,
    title: 'Customer Service Rep',
    company: 'Global Connect',
    location: 'Remote',
    type: 'Part Time',
    image: 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?auto=format&fit=crop&w=400&q=80',
    desc: 'Support customers and resolve issues via phone and email.'
  },
  {
    id: 3,
    title: 'Teaching Assistant',
    company: 'Bright Future Academy',
    location: 'Enugu, Nigeria',
    type: 'Contract',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    desc: 'Help teachers in classroom management and lesson planning.'
  },
];

export default function JobsScreen() {
  const [cachedJobs, setCachedJobs] = useState(jobs);

  useEffect(() => {
    // Load from cache on mount
    const loadCachedJobs = async () => {
      try {
        const cached = await AsyncStorage.getItem('jobsData');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setCachedJobs(parsed);
          }
        }
      } catch (e) {
        console.log('Error reading cached jobs:', e);
      }
    };

    loadCachedJobs();

    // Cache the static jobs data
    const cacheJobs = async () => {
      try {
        await AsyncStorage.setItem('jobsData', JSON.stringify(jobs));
      } catch (e) {
        console.log('Error caching jobs:', e);
      }
    };
    cacheJobs();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#3498DB" barStyle="light-content" />
      <LinearGradient colors={["#3498DB", "#43cea2"]} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>Job Opportunities</Text>
        <Text style={styles.headerSubtitle}>Find your next career move</Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cachedJobs.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => {
              Linking.openURL('https://www.jobleads.com/registration/99/jobs/en/global/Exclusive-Intern-Jobs%20%7C-Headhunters-are-looking-for-you/all/intern?utm_source=microsoft-ads_xx-search_XX__&utm_content=ALL|EN|XX_Intern-Jobs_search-jobsearch_70&utm_medium=sea-ad&utm_campaign=ALL|EN|XX&msclkid=286be4a0e42410ffa7cf8c76e580cedd');
            }}
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.company}>{item.company} • {item.location}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
              <View style={styles.row}>
                <Text style={styles.type}>{item.type}</Text>
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
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  type: {
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
