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

// File filter for multer fields - validate based on field name
const fileFilter = (req, file, cb) => {
  // PDF field should only accept PDFs
  if (file.fieldname === 'pdf') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF field must contain a PDF file'), false);
    }
  }
  // Thumbnail field should only accept images
  else if (file.fieldname === 'thumbnail') {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Thumbnail field must contain an image file'), false);
    }
  }
  // Unknown field
  else {
    cb(new Error(`Unexpected field: ${file.fieldname}`), false);
  }
};

// Alternative: Use fields for simultaneous upload
const uploadMultiple = multer({
  storage,
  fileFilter: fileFilter,
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
      console.error('Upload middleware error:', err);
      // For multer errors, return proper error response
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'File upload error' 
      });
    }
    
    try {
      // Validate PDF is present for create (not required for update)
      if (req.method === 'POST' && !req.files?.pdf?.[0]) {
        return res.status(400).json({ 
          success: false, 
          message: 'PDF file is required for creating a book' 
        });
      }
      
      // For backward compatibility, also set req.file to PDF if present
      if (req.files?.pdf?.[0]) {
        req.file = req.files.pdf[0];
      }
      
      next();
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({ 
        success: false, 
        message: validationError.message || 'File validation error' 
      });
    }
  });
};

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', protect, handleUploads, createBook);
router.put('/:id', protect, handleUploads, updateBook);
router.delete('/:id', protect, deleteBook);

module.exports = router;

