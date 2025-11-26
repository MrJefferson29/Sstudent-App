const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/libraryController');

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', protect, upload.single('pdf'), createBook);
router.put('/:id', protect, upload.single('pdf'), updateBook);
router.delete('/:id', protect, deleteBook);

module.exports = router;

