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
    const uploadOptions = {
      resource_type: 'auto',
      overwrite: false,
      unique_filename: true,
      access_mode: 'public', // Ensure files are publicly accessible
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
      if (err) {
        return reject(err);
      }
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
    return await cloudinary.uploader.explicit(publicId, {
      resource_type: resourceType,
      type: 'upload',
      access_mode: 'public',
    });
  } catch (error) {
    console.error('Error updating access mode:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadBuffer,
  deleteResource,
  updateAccessMode,
};

