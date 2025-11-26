const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');
const User = require('../models/User');

const LIBRARY_DIR = path.join(__dirname, '..', 'uploads', 'library');
fs.mkdirSync(LIBRARY_DIR, { recursive: true });

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
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return {
    ...data,
    pdfUrl: data.pdfUrl?.startsWith('http') ? data.pdfUrl : `${baseUrl}${data.pdfUrl}`,
  };
};

const savePdfToDisk = async (file) => {
  const safeName = file.originalname.replace(/[^\w.\-]+/g, '_');
  const filename = `${Date.now()}-${safeName || 'book.pdf'}`;
  const filePath = path.join(LIBRARY_DIR, filename);
  await fs.promises.writeFile(filePath, file.buffer);
  return `/uploads/library/${filename}`;
};

const removePdfFromDisk = async (pdfUrl) => {
  if (!pdfUrl) return;
  try {
    const relativePath = pdfUrl.startsWith('/uploads/')
      ? pdfUrl.replace('/uploads/', 'uploads/')
      : pdfUrl;
    const targetPath = path.join(__dirname, '..', relativePath);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
    }
  } catch (err) {
    console.warn('Failed to remove PDF file:', err.message);
  }
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

    const pdfUrl = await savePdfToDisk(req.file);

    const book = await Book.create({
      title: title.trim(),
      author: author?.trim() || 'Unknown',
      category: category?.trim() || 'General',
      description: description || '',
      publishedDate: publishedDate || '',
      pdfUrl,
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
      await removePdfFromDisk(book.pdfUrl);
      book.pdfUrl = await savePdfToDisk(req.file);
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

    await removePdfFromDisk(book.pdfUrl);
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

