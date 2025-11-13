const multer = require('multer');

// File filter - allow images only
const fileFilter = (req, file, cb) => {
  // Allow images: jpeg, jpg, png, gif, webp
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

// Configure multer for single image
const storage = multer.memoryStorage();

const uploadSingle = multer({
  storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per image
  },
});

// Configure multer for multiple images
const uploadMultiple = multer({
  storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per image
    files: 10, // Maximum 10 images
  },
});

module.exports = {
  uploadSingle: uploadSingle.single('image'),
  uploadMultiple: uploadMultiple.array('images', 10), // Allow up to 10 images
};

