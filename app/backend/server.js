const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { seedDummyDataIfEmpty } = require('./utils/seedDummy');
const multer = require('multer');
const morgan = require('morgan'); // Already required

require('dotenv').config();

// Initialize storage (Supabase > Firebase > Direct)
// Supabase is free and requires no credit card
const { initializeSupabase } = require('./utils/supabaseStorage');
const { initializeFirebase } = require('./utils/firebaseStorage');

// Try Supabase first (free, no credit card required)
try {
  initializeSupabase();
  console.log('[Storage] Using Supabase Storage for file uploads (free tier, no credit card required)');
} catch (error) {
  // Try Firebase if Supabase not configured
  try {
    initializeFirebase();
    console.log('[Storage] Using Firebase Storage for file uploads');
  } catch (firebaseError) {
    console.log('[Storage] Using direct server storage (no cloud storage configured)');
    console.log('[Storage] To use Supabase (free, no credit card): Set SUPABASE_URL and SUPABASE_ANON_KEY');
  }
}

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

// --- Middleware ---

// 1. Add Logging Middleware
app.use(morgan('dev')); // Log every incoming request to the console

// 2. CORS configuration (Correctly configured to allow all origins)
app.use(cors({
  origin: '*', // Allow all origins (for development)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files statically with proper headers for PDFs
const path = require('path');
const fs = require('fs');

// Custom static file handler for PDFs to prevent downloads (Only handles GET requests, so should not affect /auth/login)
app.use('/uploads', (req, res, next) => {
  // Only handle PDF files
  if (req.path.toLowerCase().endsWith('.pdf')) {
    const filePath = path.join(__dirname, 'uploads', req.path);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Set headers to display PDF inline (not download)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(req.path) + '"');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle OPTIONS request for CORS explicitly for this route (even though general CORS is above)
      if (req.method === 'OPTIONS') {
        // The general CORS middleware should handle this, but adding a fallback here for the custom handler chain
        return res.sendStatus(200);
      }
      
      // Send the file
      return res.sendFile(filePath);
    }
  }
  
  // For non-PDF files or if file doesn't exist, use default static handler
  next();
});

// Serve other files normally
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Ensure CORS headers for all files
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mrjfsn30:CHAINXAU.29j@cluster0.tuwn9dk.mongodb.net/?appName=Cluster0';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  // Seed dummy contests and contestants on first run
  await seedDummyDataIfEmpty();
})
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const solutionRoutes = require('./routes/solutionRoutes');
const scholarshipRoutes = require('./routes/scholarshipRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const contestRoutes = require('./routes/contestRoutes');
const voteRoutes = require('./routes/voteRoutes');
const studyGroupRoutes = require('./routes/studyGroupRoutes');
const liveRoutes = require('./routes/liveRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const concoursRoutes = require('./routes/concoursRoutes');
const courseChapterRoutes = require('./routes/courseChapterRoutes');
const courseCommentRoutes = require('./routes/courseCommentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const liveSessionRoutes = require('./routes/liveSessionRoutes');
const skillRoutes = require('./routes/skillRoutes');
const libraryRoutes = require('./routes/libraryRoutes');

app.use('/auth', authRoutes);
app.use('/questions', questionRoutes);
app.use('/solutions', solutionRoutes);
app.use('/scholarships', scholarshipRoutes);
app.use('/internships', internshipRoutes);
app.use('/contests', contestRoutes);
app.use('/votes', voteRoutes);
app.use('/study-groups', studyGroupRoutes);
app.use('/live', liveRoutes);
app.use('/schools', schoolRoutes);
app.use('/departments', departmentRoutes);
app.use('/courses', courseRoutes);
app.use('/concours', concoursRoutes);
app.use('/course-chapters', courseChapterRoutes);
app.use('/course-comments', courseCommentRoutes);
app.use('/chat', chatRoutes);
app.use('/live-sessions', liveSessionRoutes);
app.use('/skills', skillRoutes);
app.use('/library', libraryRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Student App Backend API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle multer errors (omitted for brevity)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File too large. Maximum size is 5MB for images, 10MB for PDFs' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false,
        message: 'Too many files. Maximum 10 images allowed' 
      });
    }
    return res.status(400).json({ 
      success: false,
      message: 'File upload error', 
      error: err.message 
    });
  }
  
  // Handle file type errors
  if (err.message && err.message.includes('Only')) {
    return res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Something went wrong!', 
    error: err.message 
  });
});

const PORT = process.env.PORT || 5000;
// --- Socket.IO handlers ---
const StudyGroup = require('./models/StudyGroup');
const GroupMessage = require('./models/GroupMessage');
const LiveMessage = require('./models/LiveMessage');
const ChatMessage = require('./models/ChatMessage');

io.on('connection', (socket) => {
  // Join a group room
  socket.on('join', async ({ groupId, userId, username }) => {
    if (!groupId) return;
    socket.join(groupId);
    socket.data.userId = userId;
    socket.data.username = username;
  });

  // Receive and broadcast messages
  socket.on('message', async ({ groupId, text, userId, username }) => {
    if (!groupId || !text?.trim()) return;
    try {
      // Persist message
      const msg = await GroupMessage.create({
        group: groupId,
        user: userId || null,
        username: username || 'Anonymous',
        text: text.trim(),
      });
      const payload = {
        id: msg._id.toString(),
        user: msg.username,
        text: msg.text,
        timestamp: msg.createdAt,
      };
      io.to(groupId).emit('message', payload);
    } catch (err) {
      console.error('Socket message persist error:', err);
    }
  });

  socket.on('typing', ({ groupId, username }) => {
    if (!groupId) return;
    socket.to(groupId).emit('typing', { groupId, username });
  });

  // --- Live stream chat (no persistence) ---
  socket.on('join_live', ({ room }) => {
    try {
      if (!room) return;
      socket.join(room);
      console.log(`Socket ${socket.id} joined live room ${room}`);
    } catch (err) {
      console.error('join_live error:', err);
    }
  });

  socket.on('live_message', async ({ room, username, message }) => {
    try {
      if (!room || !message) return;
      const saved = await LiveMessage.create({
        room,
        username: username || 'Guest',
        message,
      });
      const payload = {
        id: saved._id.toString(),
        username: saved.username,
        message: saved.message,
        timestamp: saved.createdAt,
      };
      io.to(room).emit('live_message', payload);
    } catch (err) {
      console.error('live_message error:', err);
      // Fallback transient broadcast
      const payload = {
        id: Date.now().toString(),
        username: username || 'Guest',
        message,
        timestamp: new Date().toISOString(),
      };
      io.to(room).emit('live_message', payload);
    }
  });

  socket.on('typing_live', ({ room, username }) => {
    try {
      if (!room) return;
      socket.to(room).emit('typing_live', { username: username || 'Someone' });
    } catch (err) {
      console.error('typing_live error:', err);
    }
  });

  // --- Video & Course chat ---
  socket.on('join_chat', ({ room }) => {
    try {
      if (!room) return;
      socket.join(room);
    } catch (err) {
      console.error('join_chat error:', err);
    }
  });

  socket.on('chat_message', async ({ room, resourceType, resourceId, text, userId, username, isQuestion }) => {
    try {
      if (!room || !resourceType || !resourceId || !text?.trim()) return;

      const saved = await ChatMessage.create({
        room,
        resourceType,
        resourceId,
        text: text.trim(),
        user: userId || null,
        username: username || 'Learner',
        isQuestion: Boolean(isQuestion),
      });

      const payload = {
        id: saved._id.toString(),
        resourceType: saved.resourceType,
        resourceId: saved.resourceId,
        text: saved.text,
        username: saved.username,
        isQuestion: saved.isQuestion,
        createdAt: saved.createdAt,
      };

      io.to(room).emit('chat_message', payload);
    } catch (err) {
      console.error('chat_message error:', err);
    }
  });
});

// Listen on all network interfaces (0.0.0.0) to accept connections from mobile devices
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
});