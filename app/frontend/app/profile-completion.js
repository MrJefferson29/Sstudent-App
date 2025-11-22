import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AuthContext } from './Contexts/AuthContext';
import { schoolsAPI, departmentsAPI, profileAPI } from './utils/api';

export default function ProfileCompletion() {
  const { user, updateUser } = useContext(AuthContext);
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [matricule, setMatricule] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchDepartments(selectedSchool);
    } else {
      setDepartments([]);
      setSelectedDepartment(null);
    }
  }, [selectedSchool]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await schoolsAPI.getAll();
      if (response.success) {
        setSchools(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      Alert.alert('Error', 'Failed to load schools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async (schoolId) => {
    try {
      const response = await departmentsAPI.getAll(schoolId);
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      Alert.alert('Error', 'Failed to load departments. Please try again.');
    }
  };

  const handleComplete = async () => {
    if (!selectedSchool) {
      Alert.alert('Error', 'Please select your school');
      return;
    }

    if (!selectedDepartment) {
      Alert.alert('Error', 'Please select your department');
      return;
    }

    if (!matricule.trim()) {
      Alert.alert('Error', 'Please enter your matricule number');
      return;
    }

    try {
      setSubmitting(true);
      const response = await profileAPI.completeProfile(
        selectedSchool,
        selectedDepartment,
        matricule.trim()
      );

      if (response.success) {
        // Update user in context
        await updateUser(response.user);
        // Redirect to home screen immediately
        router.replace('/');
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to complete profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading schools...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2563EB', '#1E3A8A']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Alert.alert(
              'Complete Profile',
              'You need to complete your profile to continue. Please select your school, department, and enter your matricule number.',
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <Text style={styles.headerSubtitle}>Help us personalize your experience</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>School *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowSchoolDropdown(!showSchoolDropdown)}
          >
            <Text style={[styles.dropdownText, !selectedSchool && styles.placeholder]}>
              {selectedSchool
                ? schools.find((s) => s._id === selectedSchool)?.name || 'Select School'
                : 'Select School'}
            </Text>
            <Ionicons
              name={showSchoolDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          {showSchoolDropdown && (
            <View style={styles.dropdownList}>
              {schools.map((school) => (
                <TouchableOpacity
                  key={school._id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedSchool(school._id);
                    setShowSchoolDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{school.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Department *</Text>
          <TouchableOpacity
            style={[styles.dropdown, !selectedSchool && styles.disabled]}
            onPress={() => selectedSchool && setShowDepartmentDropdown(!showDepartmentDropdown)}
            disabled={!selectedSchool}
          >
            <Text
              style={[
                styles.dropdownText,
                (!selectedDepartment || !selectedSchool) && styles.placeholder,
              ]}
            >
              {!selectedSchool
                ? 'Select school first'
                : selectedDepartment
                  ? departments.find((d) => d._id === selectedDepartment)?.name ||
                    'Select Department'
                  : 'Select Department'}
            </Text>
            <Ionicons
              name={showDepartmentDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          {showDepartmentDropdown && selectedSchool && (
            <View style={styles.dropdownList}>
              {departments.length === 0 ? (
                <View style={styles.dropdownItem}>
                  <Text style={styles.dropdownItemText}>No departments available</Text>
                </View>
              ) : (
                departments.map((department) => (
                  <TouchableOpacity
                    key={department._id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedDepartment(department._id);
                      setShowDepartmentDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{department.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Matricule Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your matricule number"
            value={matricule}
            onChangeText={setMatricule}
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Complete Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 10,
  },
  headerSubtitle: {
    color: '#E0E7FF',
    fontSize: 14,
    marginTop: 5,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholder: {
    color: '#9CA3AF',
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#111827',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 48,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

