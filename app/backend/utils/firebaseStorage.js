const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin (will be initialized in server.js)
let storage = null;
let isInitialized = false;

const initializeFirebase = () => {
  if (isInitialized && storage) {
    return storage;
  }

  if (admin.apps.length === 0) {
    try {
      // Check if Firebase credentials are provided via environment variables
      const firebaseConfig = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (firebaseConfig) {
        // Parse JSON from environment variable
        const serviceAccount = JSON.parse(firebaseConfig);
        const bucketName = serviceAccount.project_id + '.appspot.com';
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: bucketName,
        });
        
        console.log('[Firebase] Initialized with service account, bucket:', bucketName);
      } else if (process.env.FIREBASE_STORAGE_BUCKET) {
        // Try to use default credentials (for local development with gcloud CLI)
        admin.initializeApp({
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
        console.log('[Firebase] Initialized with default credentials, bucket:', process.env.FIREBASE_STORAGE_BUCKET);
      } else {
        throw new Error('Firebase credentials not found. Please set FIREBASE_SERVICE_ACCOUNT or FIREBASE_STORAGE_BUCKET');
      }
      
      storage = admin.storage();
      isInitialized = true;
      console.log('[Firebase] Storage initialized successfully');
    } catch (error) {
      console.error('[Firebase] Initialization error:', error.message);
      console.warn('[Firebase] Make sure FIREBASE_SERVICE_ACCOUNT is set or default credentials are available');
      throw error;
    }
  } else {
    storage = admin.storage();
    isInitialized = true;
  }
  
  return storage;
};

// Upload buffer to Firebase Storage
const uploadBuffer = async (buffer, options = {}) => {
  if (!storage) {
    initializeFirebase();
  }
  
  if (!storage) {
    throw new Error('Firebase Storage not initialized. Please check your Firebase configuration.');
  }

  const {
    folder = 'uploads',
    filename = null,
    contentType = 'application/pdf',
    makePublic = true,
  } = options;

  // Generate unique filename if not provided
  const fileExtension = contentType.split('/')[1] || 'pdf';
  const uniqueFilename = filename || `${uuidv4()}.${fileExtension}`;
  const filePath = `${folder}/${uniqueFilename}`;

  try {
    const bucket = storage.bucket();
    const file = bucket.file(filePath);

    // Upload buffer
    await file.save(buffer, {
      metadata: {
        contentType,
        metadata: {
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly accessible
    if (makePublic) {
      await file.makePublic();
    }

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    // Alternative: Get signed URL (valid for 1 year) if makePublic fails
    let secureUrl = publicUrl;
    try {
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Far future date (effectively permanent)
      });
      secureUrl = signedUrl;
    } catch (signError) {
      console.warn('Could not generate signed URL, using public URL:', signError.message);
    }

    console.log('[Firebase] Upload successful:', {
      filePath,
      publicUrl,
      secureUrl,
    });

    return {
      public_id: filePath, // Use filePath as public_id equivalent
      secure_url: secureUrl,
      public_url: publicUrl,
      url: secureUrl,
      folder,
      filename: uniqueFilename,
    };
  } catch (error) {
    console.error('[Firebase] Upload error:', error);
    throw error;
  }
};

// Delete file from Firebase Storage
const deleteFile = async (filePath) => {
  if (!storage) {
    initializeFirebase();
  }
  
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`[Firebase] File ${filePath} does not exist`);
      return null;
    }

    await file.delete();
    console.log(`[Firebase] Deleted file: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error(`[Firebase] Delete error for ${filePath}:`, error);
    throw error;
  }
};

// Get public URL for a file
const getPublicUrl = (filePath) => {
  if (!filePath) return null;
  
  // If already a full URL, return it
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'your-project-id.appspot.com';
  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
};

// Get signed URL (for private files or long-term access)
const getSignedUrl = async (filePath, expiresIn = 31536000) => { // 1 year default
  if (!storage) {
    initializeFirebase();
  }
  
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File ${filePath} does not exist`);
    }

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: new Date(Date.now() + expiresIn * 1000),
    });

    return signedUrl;
  } catch (error) {
    console.error(`[Firebase] Error getting signed URL for ${filePath}:`, error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  uploadBuffer,
  deleteFile,
  getPublicUrl,
  getSignedUrl,
  storage,
};

