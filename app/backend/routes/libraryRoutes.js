const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/libraryController');

// Configure multer for multiple file types
const storage = multer.memoryStorage();

// PDF file filter
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Image file filter
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const uploadPDF = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Combined upload middleware for PDF and optional thumbnail
const uploadFields = (req, res, next) => {
  const pdfUpload = uploadPDF.single('pdf');
  const thumbnailUpload = uploadImage.single('thumbnail');
  
  pdfUpload(req, res, (err) => {
    if (err) return next(err);
    thumbnailUpload(req, res, (err) => {
      if (err) return next(err);
      // Store thumbnail in req.files for consistency
      if (req.file && req.file.fieldname === 'thumbnail') {
        req.files = req.files || {};
        req.files.thumbnail = req.file;
        req.file = null; // Clear req.file so PDF handler doesn't get confused
      }
      next();
    });
  });
};

// Alternative: Use fields for simultaneous upload
const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// Custom middleware to handle both PDF and thumbnail
const handleUploads = (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      // If it's a file type error, try to provide better message
      if (err.message.includes('Unexpected field')) {
        return next(new Error('Invalid file field. Use "pdf" for PDF and "thumbnail" for images.'));
      }
      return next(err);
    }
    
    // Validate PDF is present for create/update
    if ((req.method === 'POST' || req.method === 'PUT') && !req.files?.pdf?.[0]) {
      // Only require PDF on create, not on update
      if (req.method === 'POST') {
        return next(new Error('PDF file is required'));
      }
    }
    
    // Validate PDF file type
    if (req.files?.pdf?.[0]) {
      const pdfFile = req.files.pdf[0];
      if (pdfFile.mimetype !== 'application/pdf') {
        return next(new Error('PDF file must be of type application/pdf'));
      }
    }
    
    // Validate thumbnail file type if present
    if (req.files?.thumbnail?.[0]) {
      const thumbFile = req.files.thumbnail[0];
      if (!thumbFile.mimetype.startsWith('image/')) {
        return next(new Error('Thumbnail must be an image file'));
      }
    }
    
    // For backward compatibility, also set req.file to PDF if present
    if (req.files?.pdf?.[0]) {
      req.file = req.files.pdf[0];
    }
    
    next();
  });
};

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', protect, handleUploads, createBook);
router.put('/:id', protect, handleUploads, updateBook);
router.delete('/:id', protect, deleteBook);

module.exports = router;

