/**
 * Supabase Storage Utility
 * Free tier: 1GB storage, 2GB/month bandwidth, no credit card required
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

let supabase = null;
let isInitialized = false;

const initializeSupabase = () => {
  if (isInitialized && supabase) {
    return supabase;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  // Use service role key for server-side uploads (bypasses RLS)
  // Fallback to anon key if service role not available
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  }

  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    isInitialized = true;
    const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role' : 'anon';
    console.log(`[Supabase] Initialized successfully with ${keyType} key`);
    return supabase;
  } catch (error) {
    console.error('[Supabase] Initialization error:', error.message);
    throw error;
  }
};

/**
 * Upload buffer to Supabase Storage
 */
const uploadBuffer = async (buffer, options = {}) => {
  if (!supabase) {
    initializeSupabase();
  }

  const {
    folder = 'uploads',
    filename = null,
    contentType = 'application/pdf',
  } = options;

  // Generate unique filename
  const fileExtension = contentType.split('/')[1] || 'pdf';
  const uniqueFilename = filename || `${uuidv4()}.${fileExtension}`;
  const filePath = `${folder}/${uniqueFilename}`;

  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from('pdfs') // Bucket name - you'll create this in Supabase
      .upload(filePath, buffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    console.log('[Supabase] Upload successful:', {
      filePath,
      publicUrl,
    });

    return {
      public_id: filePath,
      secure_url: publicUrl,
      public_url: publicUrl,
      url: publicUrl,
      folder,
      filename: uniqueFilename,
    };
  } catch (error) {
    console.error('[Supabase] Upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Supabase Storage
 */
const deleteFile = async (filePath) => {
  if (!supabase) {
    initializeSupabase();
  }

  try {
    const { error } = await supabase.storage
      .from('pdfs')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    console.log(`[Supabase] Deleted file: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error(`[Supabase] Delete error for ${filePath}:`, error);
    throw error;
  }
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

  if (!supabase) {
    initializeSupabase();
  }

  const { data } = supabase.storage
    .from('pdfs')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Get signed URL (for private files)
 */
const getSignedUrl = async (filePath, expiresIn = 3600) => {
  if (!supabase) {
    initializeSupabase();
  }

  try {
    const { data, error } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error(`[Supabase] Error getting signed URL for ${filePath}:`, error);
    throw error;
  }
};

module.exports = {
  initializeSupabase,
  uploadBuffer,
  deleteFile,
  getPublicUrl,
  getSignedUrl,
  supabase,
};

