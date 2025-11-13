// API Configuration
// Change this to your backend URL
// For local development: 'http://localhost:5000'
// For production: 'https://your-backend-url.com'
// For Android emulator: 'http://10.0.2.2:5000'
// For iOS simulator: 'http://localhost:5000'
// For physical device: 'http://YOUR_COMPUTER_IP:5000'

export const API_URL = __DEV__ 
  ? 'http://10.6.18.196:5000'  // Development
  : 'https://your-backend-url.com';  // Production

export default API_URL;

