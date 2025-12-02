/**
 * Unified Storage Utility
 * Supports Supabase Storage (free, no credit card), Firebase Storage, and Direct Server Storage
 */

const { uploadBuffer: firebaseUpload, deleteFile: firebaseDelete, getPublicUrl: firebaseGetUrl } = require('./firebaseStorage');
const { uploadBuffer: supabaseUpload, deleteFile: supabaseDelete, getPublicUrl: supabaseGetUrl } = require('./supabaseStorage');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Storage mode: 'supabase', 'firebase', or 'direct'
// Priority: Supabase (free, no credit card) > Firebase > Direct
const getStorageMode = () => {
  if (process.env.STORAGE_MODE) {
    return process.env.STORAGE_MODE;
  }
  // Auto-detect: prefer Supabase (free, no credit card), then Firebase, then direct
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return 'supabase';
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return 'firebase';
  }
  return 'direct';
};

/**
 * Upload a buffer to storage
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with URL
 */
const uploadBuffer = async (buffer, options = {}) => {
  const mode = getStorageMode();
  const {
    folder = 'uploads',
    filename = null,
    contentType = 'application/pdf',
  } = options;

  // Try Supabase first (free, no credit card required)
  if (mode === 'supabase') {
    try {
      return await supabaseUpload(buffer, options);
    } catch (error) {
      if (process.env.STORAGE_MODE === 'supabase') {
        console.error('[Storage] Supabase upload failed and STORAGE_MODE=supabase is set. Check your Supabase configuration.');
        throw new Error(`Supabase upload failed: ${error.message}. Please verify SUPABASE_URL and SUPABASE_ANON_KEY are correctly configured.`);
      }
      console.warn('[Storage] Supabase upload failed, falling back to direct storage:', error.message);
      // Fall through to direct storage
    }
  }

  // Try Firebase
  if (mode === 'firebase') {
    try {
      return await firebaseUpload(buffer, options);
    } catch (error) {
      if (process.env.STORAGE_MODE === 'firebase') {
        console.error('[Storage] Firebase upload failed and STORAGE_MODE=firebase is set. Check your Firebase configuration.');
        throw new Error(`Firebase upload failed: ${error.message}. Please verify FIREBASE_SERVICE_ACCOUNT is correctly configured.`);
      }
      console.warn('[Storage] Firebase upload failed, falling back to direct storage:', error.message);
      // Fall through to direct storage
    }
  }

  // Direct server storage (fallback or default)
  return uploadToDirectStorage(buffer, { folder, filename, contentType });
};

/**
 * Upload to direct server storage
 */
const uploadToDirectStorage = async (buffer, options = {}) => {
  const { folder = 'uploads', filename = null, contentType = 'application/pdf' } = options;
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '..', 'uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate filename
  const fileExtension = contentType.split('/')[1] || 'pdf';
  const uniqueFilename = filename || `${uuidv4()}.${fileExtension}`;
  const filePath = path.join(uploadsDir, uniqueFilename);

  // Write file
  fs.writeFileSync(filePath, buffer);

  // Generate public URL
  const baseUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:5000';
  const publicUrl = `${baseUrl}/uploads/${folder}/${uniqueFilename}`;

  console.log('[Storage] Direct upload successful:', {
    filePath,
    publicUrl,
  });

  return {
    public_id: `${folder}/${uniqueFilename}`,
    secure_url: publicUrl,
    public_url: publicUrl,
    url: publicUrl,
    folder,
    filename: uniqueFilename,
  };
};

/**
 * Delete a file from storage
 */
const deleteResource = async (filePath, resourceType = 'raw') => {
  const mode = getStorageMode();

  if (mode === 'supabase') {
    try {
      return await supabaseDelete(filePath);
    } catch (error) {
      console.warn('[Storage] Supabase delete failed, trying direct storage:', error.message);
      // Fall through to direct storage
    }
  }

  if (mode === 'firebase') {
    try {
      return await firebaseDelete(filePath);
    } catch (error) {
      console.warn('[Storage] Firebase delete failed, trying direct storage:', error.message);
      // Fall through to direct storage
    }
  }

  // Direct server storage
  const fullPath = path.join(__dirname, '..', 'uploads', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log('[Storage] Direct delete successful:', filePath);
    return { success: true };
  }
  
  return null;
};

/**
 * Get public URL for a file
 */
const getPublicUrl = (filePath) => {
  if (!filePath) return null;

  // If already a full URL, return it
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const mode = getStorageMode();
  
  if (mode === 'supabase') {
    return supabaseGetUrl(filePath);
  }
  
  if (mode === 'firebase') {
    return firebaseGetUrl(filePath);
  }

  // Direct server storage
  const baseUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${filePath}`;
};

/**
 * Update access mode (for compatibility with Cloudinary API)
 * Not needed for direct storage or Firebase (public by default)
 */
const updateAccessMode = async (publicId, resourceType = 'image') => {
  // No-op for direct storage and Firebase (files are public by default)
  console.log(`[Storage] Access mode update requested for ${publicId} (no-op)`);
  return { access_mode: 'public' };
};

/**
 * Get signed URL (for compatibility)
 * For direct storage, just returns the public URL
 */
const getSignedUrl = async (publicId, options = {}) => {
  return getPublicUrl(publicId);
};

module.exports = {
  uploadBuffer,
  deleteResource,
  getPublicUrl,
  updateAccessMode,
  getSignedUrl,
  getStorageMode,
};

