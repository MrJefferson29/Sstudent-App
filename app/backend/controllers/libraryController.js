const Book = require('../models/Book');
const User = require('../models/User');
const { uploadBuffer, deleteResource, getPublicUrl } = require('../utils/storage');

const ensureAdmin = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'admin') {
    const error = new Error('Only admins can manage library books');
    error.statusCode = 403;
    throw error;
  }
  return user;
};

const buildBookResponse = (book, req) => {
  const data = book.toObject ? book.toObject() : book;
  // pdfUrl is already a full URL from unified storage
  return data;
};

exports.createBook = async (req, res) => {
  try {
    await ensureAdmin(req.userId);
    const { title, author, category, description, publishedDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    const upload = await uploadBuffer(req.file.buffer, {
      folder: 'library',
      contentType: 'application/pdf',
      filename: req.file.originalname,
    });

    const book = await Book.create({
      title: title.trim(),
      author: author?.trim() || 'Unknown',
      category: category?.trim() || 'General',
      description: description || '',
      publishedDate: publishedDate || '',
      pdfUrl: upload.secure_url,
      pdfPublicId: upload.public_id,
      uploadedBy: req.userId,
    });

    res.status(201).json({
      success: true,
      data: buildBookResponse(book, req),
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create book',
    });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const { category, author, query } = req.query;
    const filter = {};

    if (category) {
      filter.category = { $regex: new RegExp(category, 'i') };
    }
    if (author) {
      filter.author = { $regex: new RegExp(author, 'i') };
    }
    if (query) {
      filter.$or = [
        { title: { $regex: new RegExp(query, 'i') } },
        { description: { $regex: new RegExp(query, 'i') } },
        { category: { $regex: new RegExp(query, 'i') } },
      ];
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });
    const data = books.map((book) => buildBookResponse(book, req));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch books' });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: buildBookResponse(book, req) });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch book' });
  }
};

exports.updateBook = async (req, res) => {
  try {
    await ensureAdmin(req.userId);
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const { title, author, category, description, publishedDate } = req.body;
    if (title) book.title = title.trim();
    if (author !== undefined) book.author = author;
    if (category !== undefined) book.category = category;
    if (description !== undefined) book.description = description;
    if (publishedDate !== undefined) book.publishedDate = publishedDate;

    if (req.file) {
      if (book.pdfPublicId) {
        await deleteResource(book.pdfPublicId);
      }
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'library',
        contentType: 'application/pdf',
        filename: req.file.originalname,
      });
      book.pdfUrl = upload.secure_url;
      book.pdfPublicId = upload.public_id;
    }

    await book.save();
    res.json({ success: true, data: buildBookResponse(book, req) });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update book',
    });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    await ensureAdmin(req.userId);
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.pdfPublicId) {
      await deleteResource(book.pdfPublicId);
    }
    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete book',
    });
  }
};

