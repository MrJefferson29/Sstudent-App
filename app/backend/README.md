# Student App Backend

Backend server for the Student App with user authentication.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Create a `.env` file in the backend directory:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/studentapp
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on your system. If you don't have MongoDB installed:
   - Install MongoDB locally, or
   - Use MongoDB Atlas (cloud) and update the MONGODB_URI in `.env`

4. **Run the Server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes

- **POST** `/auth/register` - Register a new user
  - Body: `{ name, email, password, school?, department?, level? }`
  - Returns: `{ success, message, token, user }`

- **POST** `/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ success, message, token, user }`

- **GET** `/auth/me` - Get current user (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success, user }`

### Question Routes

- **POST** `/questions` - Upload a new question (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Body (multipart/form-data): `{ school, department, level, subject, year, pdf (file) }`
  - Returns: `{ success, message, data: question }`

- **GET** `/questions` - Get all questions (with optional filters)
  - Query params: `?school=...&department=...&level=...&subject=...&year=...`
  - Returns: `{ success, count, data: questions[] }`

- **GET** `/questions/:id` - Get a single question with its solutions
  - Returns: `{ success, data: { question, solutions[] } }`

- **DELETE** `/questions/:id` - Delete a question (Protected, owner only)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success, message }`

### Solution Routes

- **POST** `/solutions` - Upload a new solution (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Body (multipart/form-data): `{ questionId, youtubeUrl?, pdf (file)? }`
  - Note: At least one of `youtubeUrl` or `pdf` must be provided
  - Returns: `{ success, message, data: solution }`

- **GET** `/solutions` - Get all solutions (with optional filter)
  - Query params: `?questionId=...`
  - Returns: `{ success, count, data: solutions[] }`

- **GET** `/solutions/:id` - Get a single solution
  - Returns: `{ success, data: solution }`

- **DELETE** `/solutions/:id` - Delete a solution (Protected, owner only)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success, message }`

## Project Structure

```
backend/
├── models/
│   ├── User.js          # User model with Mongoose
│   ├── Question.js      # Question model
│   └── Solution.js      # Solution model
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── questionController.js # Question operations
│   └── solutionController.js # Solution operations
├── routes/
│   ├── authRoutes.js    # Authentication routes
│   ├── questionRoutes.js # Question routes
│   └── solutionRoutes.js  # Solution routes
├── middleware/
│   ├── authMiddleware.js  # JWT authentication middleware
│   └── upload.js         # File upload middleware (multer)
├── uploads/              # Directory for uploaded PDFs
├── server.js            # Main server file
└── package.json
```

