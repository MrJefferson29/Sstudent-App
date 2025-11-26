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
    // Build upload options - ensure access_mode is always public and type is upload
    const uploadOptions = {
      resource_type: 'auto',
      overwrite: false,
      unique_filename: true,
      access_mode: 'public', // Ensure files are publicly accessible
      type: 'upload', // Explicitly set type to 'upload' (not 'authenticated' or 'private')
      ...options,
      // Force access_mode and type after merging options (in case they were overridden)
      access_mode: 'public',
      type: 'upload',
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
    // For raw files, use explicit method which is more reliable
    if (resourceType === 'raw') {
      const result = await cloudinary.uploader.explicit(publicId, {
        resource_type: 'raw',
        type: 'upload',
        access_mode: 'public',
        invalidate: true,
      });
      console.log(`Updated access mode for ${publicId} to public (using explicit)`, {
        access_mode: result.access_mode,
        public_id: result.public_id,
      });
      return result;
    } else {
      // For images/videos, use api.update
      const result = await cloudinary.api.update(publicId, {
        access_mode: 'public',
        invalidate: true,
      }, {
        resource_type: resourceType,
      });
      console.log(`Updated access mode for ${publicId} to public (using api.update)`);
      return result;
    }
  } catch (error) {
    console.error(`Error updating access mode for ${publicId}:`, error);
    console.error('Error details:', {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
    });
    // Don't throw - log and continue (upload was successful)
    return null;
  }
};

// Generate a signed URL for a resource (useful for private/authenticated resources)
const getSignedUrl = (publicId, options = {}) => {
  const {
    resource_type = 'raw',
    expires_in = 3600, // 1 hour default
    transformation = null,
  } = options;

  try {
    // For signed URLs, we need to use the authenticated type and sign it
    // This works even if the resource is marked as "authenticated" or "private"
    const signedUrl = cloudinary.url(publicId, {
      resource_type,
      type: 'authenticated', // Use authenticated type for signed URLs
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expires_in,
      secure: true,
      ...(transformation && { transformation }),
    });

    console.log(`Generated signed URL for ${publicId} (expires in ${expires_in}s)`);
    return signedUrl;
  } catch (error) {
    console.error(`Error generating signed URL for ${publicId}:`, error);
    // Fallback: try without type specification
    try {
      const fallbackUrl = cloudinary.url(publicId, {
        resource_type,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + expires_in,
        secure: true,
      });
      console.log(`Generated fallback signed URL for ${publicId}`);
      return fallbackUrl;
    } catch (fallbackError) {
      console.error(`Fallback signed URL generation also failed for ${publicId}:`, fallbackError);
      return null;
    }
  }
};

// Extract public_id from a Cloudinary URL
const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
    // Example: https://res.cloudinary.com/da57ehczx/raw/upload/v1764107967/questions/dcqfvgvxllmfhikn3yer.pdf
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Alternative format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}
    const altMatch = url.match(/\/upload\/(.+)$/);
    if (altMatch && altMatch[1]) {
      return altMatch[1].replace(/^v\d+\//, ''); // Remove version prefix if present
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
};

// Get a public URL (preferred) or signed URL (fallback) for a resource
const getAccessibleUrl = async (publicIdOrUrl, resourceType = 'raw') => {
  if (!publicIdOrUrl) return null;

  // If it's a URL, extract the public_id
  let publicId = publicIdOrUrl;
  if (publicIdOrUrl.includes('res.cloudinary.com')) {
    publicId = extractPublicIdFromUrl(publicIdOrUrl);
    if (!publicId) {
      console.error('Could not extract public_id from URL:', publicIdOrUrl);
      // If we can't extract, try to generate signed URL from the URL itself
      // This is a fallback - Cloudinary might accept the full URL path
      return getSignedUrl(publicIdOrUrl.replace(/^https?:\/\/[^\/]+/, ''), { resource_type: resourceType });
    }
    console.log(`Extracted public_id from URL: ${publicId}`);
  }

  try {
    // First, try to get the resource info to check its access mode
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });

    console.log(`Resource info for ${publicId}:`, {
      access_mode: resource.access_mode,
      type: resource.type,
      secure_url: resource.secure_url,
    });

    // If it's public and type is upload, return the direct URL
    if (resource.access_mode === 'public' && resource.type === 'upload') {
      const directUrl = cloudinary.url(publicId, {
        resource_type: resourceType,
        secure: true,
      });
      console.log(`Using direct URL for ${publicId}:`, directUrl);
      return directUrl;
    }

    // If it's not public or type is not upload, generate a signed URL
    console.log(`Resource is not fully public (access_mode: ${resource.access_mode}, type: ${resource.type}), generating signed URL for ${publicId}`);
    const signedUrl = getSignedUrl(publicId, { resource_type: resourceType });
    console.log(`Generated signed URL for ${publicId}:`, signedUrl);
    return signedUrl;
  } catch (error) {
    console.error(`Error getting accessible URL for ${publicId}:`, error);
    // Fallback: try to generate signed URL anyway
    console.log(`Fallback: Generating signed URL for ${publicId}`);
    const signedUrl = getSignedUrl(publicId, { resource_type: resourceType });
    if (!signedUrl) {
      console.error(`Failed to generate signed URL for ${publicId}`);
    }
    return signedUrl;
  }
};

module.exports = {
  cloudinary,
  uploadBuffer,
  deleteResource,
  updateAccessMode,
  getSignedUrl,
  getAccessibleUrl,
  extractPublicIdFromUrl,
};

