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
  if (Platform.OS === 'android') return 'https://uba-r875.onrender.com'; // Android emulator
  if (Platform.OS === 'ios') return 'https://uba-r875.onrender.com';     // iOS simulator
  if (Platform.OS === 'web') return 'https://uba-r875.onrender.com';     // Expo web
  // Fallback
  return 'https://uba-r875.onrender.com';
})();

export const API_URL = __DEV__
  ? DEV_API_URL
  : (process.env.EXPO_PUBLIC_API_URL || 'https://uba-r875.onrender.com');

export const resolveAssetUrl = (value) => {
  if (!value) return null;

  if (typeof value === 'object') {
    const candidate = value.url || value.secure_url || value.path;
    if (!candidate) return null;
    return /^https?:\/\//i.test(candidate) ? candidate : `${API_URL}${candidate}`;
  }

  if (typeof value === 'string') {
    return /^https?:\/\//i.test(value) ? value : `${API_URL}${value}`;
  }

  return null;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
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

// Schools API
export const schoolsAPI = {
  getAll: async () => {
    const response = await api.get('/schools');
    return response.data;
  },

  getById: async (schoolId) => {
    const response = await api.get(`/schools/${schoolId}`);
    return response.data;
  },
};

// Departments API
export const departmentsAPI = {
  getAll: async (schoolId = null) => {
    const params = schoolId ? `?school=${schoolId}` : '';
    const response = await api.get(`/departments${params}`);
    return response.data;
  },

  getById: async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}`);
    return response.data;
  },
};

// Questions API
export const questionsAPI = {
  // Get signed URL for a question PDF (fallback if direct URL doesn't work)
  getSignedUrl: async (questionId) => {
    const response = await api.get(`/questions/signed-url/${questionId}`);
    return response.data;
  },
  
  // Get all questions with optional filters
  getAll: async (filters = {}, signal = null) => {
    const params = new URLSearchParams();
    if (filters.department) params.append('department', filters.department);
    if (filters.level) params.append('level', filters.level);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.year) params.append('year', filters.year);

    const config = signal ? { signal } : {};
    const response = await api.get(`/questions?${params.toString()}`, config);
    return response.data;
  },

  // Get unique subjects for a department and level
  getSubjects: async (departmentId, level, signal = null) => {
    const params = new URLSearchParams();
    if (departmentId) params.append('department', departmentId);
    if (level) params.append('level', level);

    const config = signal ? { signal } : {};
    const response = await api.get(`/questions/subjects?${params.toString()}`, config);
    return response.data;
  },

  // Get single question with solutions
  getById: async (questionId) => {
    const response = await api.get(`/questions/${questionId}`);
    return response.data;
  },
};

// Courses API
export const coursesAPI = {
  getAll: async (departmentId = null, level = null, signal = null) => {
    const params = new URLSearchParams();
    if (departmentId) params.append('department', departmentId);
    if (level) params.append('level', level);
    const config = signal ? { signal } : {};
    const response = await api.get(`/courses?${params.toString()}`, config);
    return response.data;
  },

  getById: async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },
};

// Course Chapters API
export const courseChaptersAPI = {
  getByCourse: async (courseId) => {
    const response = await api.get(`/course-chapters/course/${courseId}`);
    return response.data;
  },

  getById: async (chapterId) => {
    const response = await api.get(`/course-chapters/${chapterId}`);
    return response.data;
  },
};

// Course Comments API
export const courseCommentsAPI = {
  getByChapter: async (chapterId, type = null) => {
    const params = type ? `?type=${type}` : '';
    const response = await api.get(`/course-comments/chapter/${chapterId}${params}`);
    return response.data;
  },

  create: async (commentData) => {
    const response = await api.post('/course-comments', commentData);
    return response.data;
  },

  update: async (commentId, commentData) => {
    const response = await api.put(`/course-comments/${commentId}`, commentData);
    return response.data;
  },

  delete: async (commentId) => {
    const response = await api.delete(`/course-comments/${commentId}`);
    return response.data;
  },
};

// Concours API
export const concoursAPI = {
  getAll: async (departmentId = null, year = null) => {
    const params = new URLSearchParams();
    if (departmentId) params.append('department', departmentId);
    if (year) params.append('year', year);
    const response = await api.get(`/concours?${params.toString()}`);
    return response.data;
  },

  getById: async (concoursId) => {
    const response = await api.get(`/concours/${concoursId}`);
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
  getAll: async (signal = null) => {
    const config = signal ? { signal } : {};
    const response = await api.get('/scholarships', config);
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
  getAll: async (signal = null) => {
    const config = signal ? { signal } : {};
    const response = await api.get('/internships', config);
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

  // Complete profile (for new registrations)
  completeProfile: async (school, department, matricule) => {
    const response = await api.post('/auth/profile/complete', {
      school,
      department,
      matricule,
    });
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

// Skills API
export const skillsAPI = {
  getAll: async (category = null) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    const response = await api.get(`https://ficedu-payment.onrender.com/skills?${params.toString()}`);
    return response.data;
  },

  getById: async (skillId) => {
    const response = await api.get(`https://ficedu-payment.onrender.com/skills/${skillId}`);
    return response.data;
  },
};

export const skillChaptersAPI = {
  getBySkill: async (skillId) => {
    const response = await api.get(`https://ficedu-payment.onrender.com/skill-chapters/skill/${skillId}`);
    return response.data;
  },

  getById: async (chapterId) => {
    const response = await api.get(`https://ficedu-payment.onrender.com/skill-chapters/${chapterId}`);
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  getMessages: async (resourceType, resourceId, limit = 100) => {
    const response = await api.get(`/chat/${resourceType}/${resourceId}?limit=${limit}`);
    return response.data;
  },

  createMessage: async (payload) => {
    const response = await api.post('/chat', payload);
    return response.data;
  },
};

// Live Sessions API
export const liveSessionsAPI = {
  getAll: async (params = {}) => {
    const search = new URLSearchParams(params);
    const query = search.toString();
    const response = await api.get(`/live-sessions${query ? `?${query}` : ''}`);
    return response.data;
  },

  getById: async (sessionId) => {
    const response = await api.get(`/live-sessions/${sessionId}`);
    return response.data;
  },
};

// Library API
export const libraryAPI = {
  getAll: async (filters = {}, signal = null) => {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.author) params.append('author', filters.author);
    if (filters.query) params.append('query', filters.query);

    const config = signal ? { signal } : {};
    const response = await api.get(`/library?${params.toString()}`, config);
    return response.data;
  },

  getById: async (bookId) => {
    const response = await api.get(`/library/${bookId}`);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (limit = 50) => {
    const response = await api.get(`/notifications?limit=${limit}`);
    return response.data;
  },

  getById: async (notificationId) => {
    const response = await api.get(`/notifications/${notificationId}`);
    return response.data;
  },

  create: async (formData) => {
    const response = await api.post('/notifications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (notificationId, formData) => {
    const response = await api.put(`/notifications/${notificationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default api;

