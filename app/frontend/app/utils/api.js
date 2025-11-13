import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Configuration - Update this URL to match your backend
// For local development: 'http://localhost:5000'
// For Android emulator: 'http://10.0.2.2:5000'
// For iOS simulator: 'http://localhost:5000'
// For physical device: 'http://YOUR_COMPUTER_IP:5000'
// Determine development API URL by platform with optional env override
const DEV_API_URL = (() => {
  // Allow override via Expo public env var
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // Default per-platform
  if (Platform.OS === 'android') return 'http://192.168.1.184:5000'; // Android emulator
  if (Platform.OS === 'ios') return 'http://localhost:5000';     // iOS simulator
  if (Platform.OS === 'web') return 'http://localhost:5000';     // Expo web
  // Fallback
  return 'http://localhost:5000';
})();

export const API_URL = __DEV__
  ? DEV_API_URL
  : (process.env.EXPO_PUBLIC_API_URL || 'https://your-backend-url.com');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Questions API
export const questionsAPI = {
  // Get all questions with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.school) params.append('school', filters.school);
    if (filters.department) params.append('department', filters.department);
    if (filters.level) params.append('level', filters.level);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.year) params.append('year', filters.year);

    const response = await api.get(`/questions?${params.toString()}`);
    return response.data;
  },

  // Get single question with solutions
  getById: async (questionId) => {
    const response = await api.get(`/questions/${questionId}`);
    return response.data;
  },
};

// Solutions API
export const solutionsAPI = {
  // Get all solutions with optional filter
  getAll: async (questionId = null) => {
    const params = questionId ? `?questionId=${questionId}` : '';
    const response = await api.get(`/solutions${params}`);
    return response.data;
  },

  // Get single solution
  getById: async (solutionId) => {
    const response = await api.get(`/solutions/${solutionId}`);
    return response.data;
  },
};

// Scholarships API
export const scholarshipsAPI = {
  // Get all scholarships
  getAll: async () => {
    const response = await api.get('/scholarships');
    return response.data;
  },

  // Get single scholarship
  getById: async (scholarshipId) => {
    const response = await api.get(`/scholarships/${scholarshipId}`);
    return response.data;
  },
};

// Internships API
export const internshipsAPI = {
  // Get all internships
  getAll: async () => {
    const response = await api.get('/internships');
    return response.data;
  },

  // Get single internship
  getById: async (internshipId) => {
    const response = await api.get(`/internships/${internshipId}`);
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (formData) => {
    const response = await api.put('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/profile/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Get user statistics
  getStats: async () => {
    const response = await api.get('/auth/profile/stats');
    return response.data;
  },
};

// Contests API
export const contestsAPI = {
  // Get all contests
  getAll: async () => {
    const response = await api.get('/contests');
    return response.data;
  },

  // Get contestants for a contest
  getContestants: async (contestId) => {
    const response = await api.get(`/contests/${contestId}/contestants`);
    return response.data;
  },

  // Get contest statistics
  getStats: async (contestId) => {
    const response = await api.get(`/contests/${contestId}/stats`);
    return response.data;
  },
};

// Votes API
export const votesAPI = {
  // Cast a vote
  castVote: async (contestId, contestantId) => {
    const response = await api.post('/votes', { contestId, contestantId });
    return response.data;
  },

  // Get user's votes
  getMyVotes: async () => {
    const response = await api.get('/votes/my-votes');
    return response.data;
  },
};

export default api;

