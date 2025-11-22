const cloudinary = require('cloudinary').v2;

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn(
    '[Cloudinary] Missing credentials. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.'
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    // Build upload options - ensure access_mode is always public
    const uploadOptions = {
      resource_type: 'auto',
      overwrite: false,
      unique_filename: true,
      access_mode: 'public', // Ensure files are publicly accessible
      type: 'upload', // Explicitly set type
      ...options,
      // Force access_mode to public after merging options (in case it was overridden)
      access_mode: 'public',
    };

    console.log('Uploading with options:', {
      resource_type: uploadOptions.resource_type,
      folder: uploadOptions.folder,
      access_mode: uploadOptions.access_mode,
      type: uploadOptions.type,
    });

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
      if (err) {
        console.error('Cloudinary upload error:', err);
        return reject(err);
      }
      console.log('Upload successful:', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        access_mode: result.access_mode,
      });
      return resolve(result);
    });

    stream.end(buffer);
  });

const deleteResource = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

// Update access mode of an existing resource to public
const updateAccessMode = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  try {
    // Use update API to change access mode
    const result = await cloudinary.api.update(publicId, {
      resource_type: resourceType,
      access_mode: 'public',
      invalidate: true, // Invalidate CDN cache
    });
    console.log(`Updated access mode for ${publicId} to public`);
    return result;
  } catch (error) {
    console.error(`Error updating access mode for ${publicId}:`, error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadBuffer,
  deleteResource,
  updateAccessMode,
};

