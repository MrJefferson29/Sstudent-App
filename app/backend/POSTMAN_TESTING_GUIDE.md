# Postman Testing Guide

This guide will help you test all the backend endpoints using Postman.

## Prerequisites

1. Make sure your backend server is running:
   ```bash
   cd app/backend
   npm install  # Install multer if not already installed
   npm run dev
   ```

2. Make sure MongoDB is running

3. The server should be accessible at `http://localhost:5000` (or your configured port)

---

## 1. Authentication Endpoints

### 1.1 Register a New User

**Request:**
- Method: `POST`
- URL: `http://localhost:5000/auth/register`
- Headers: 
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "school": "Coltech",
  "department": "Computer Science",
  "level": "Level 100"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "school": "Coltech",
    "department": "Computer Science",
    "level": "Level 100"
  }
}
```

**Save the token** from the response - you'll need it for protected routes!

---

### 1.2 Login User

**Request:**
- Method: `POST`
- URL: `http://localhost:5000/auth/login`
- Headers: 
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### 1.3 Get Current User (Protected)

**Request:**
- Method: `GET`
- URL: `http://localhost:5000/auth/me`
- Headers: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`
  - Replace `YOUR_TOKEN_HERE` with the token from login/register

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## 2. Question Endpoints

### 2.1 Upload a Question (Protected)

**Request:**
- Method: `POST`
- URL: `http://localhost:5000/questions`
- Headers: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- Body (form-data):
  - `school`: `Coltech` (Text)
  - `department`: `Computer Science` (Text)
  - `level`: `Level 100` (Text)
  - `subject`: `Mathematics` (Text)
  - `year`: `2023` (Text)
  - `pdf`: [Select File] - Choose a PDF file

**Note:** In Postman:
1. Select `Body` tab
2. Choose `form-data`
3. Add text fields for school, department, level, subject, year
4. Add a file field named `pdf` and select a PDF file

**Expected Response:**
```json
{
  "success": true,
  "message": "Question uploaded successfully",
  "data": {
    "_id": "...",
    "school": "Coltech",
    "department": "Computer Science",
    "level": "Level 100",
    "subject": "Mathematics",
    "year": "2023",
    "pdfUrl": "http://localhost:5000/uploads/1234567890-filename.pdf",
    "uploadedBy": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Save the question ID** from the response - you'll need it for solutions!

---

### 2.2 Get All Questions

**Request:**
- Method: `GET`
- URL: `http://localhost:5000/questions`
- No headers required

**With Filters:**
- URL: `http://localhost:5000/questions?school=Coltech&department=Computer Science&level=Level 100&subject=Mathematics&year=2023`
- You can use any combination of filters: `school`, `department`, `level`, `subject`, `year`

**Expected Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "school": "Coltech",
      "department": "Computer Science",
      "level": "Level 100",
      "subject": "Mathematics",
      "year": "2023",
      "pdfUrl": "http://localhost:5000/uploads/...",
      "uploadedBy": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 2.3 Get Single Question with Solutions

**Request:**
- Method: `GET`
- URL: `http://localhost:5000/questions/QUESTION_ID_HERE`
- Replace `QUESTION_ID_HERE` with an actual question ID

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "question": {
      "_id": "...",
      "school": "Coltech",
      "department": "Computer Science",
      "level": "Level 100",
      "subject": "Mathematics",
      "year": "2023",
      "pdfUrl": "http://localhost:5000/uploads/...",
      "uploadedBy": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "solutions": [
      {
        "_id": "...",
        "question": "...",
        "youtubeUrl": "https://www.youtube.com/watch?v=...",
        "pdfUrl": null,
        "uploadedBy": {
          "_id": "...",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 2.4 Delete a Question (Protected, Owner Only)

**Request:**
- Method: `DELETE`
- URL: `http://localhost:5000/questions/QUESTION_ID_HERE`
- Headers: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- Replace `QUESTION_ID_HERE` with an actual question ID

**Expected Response:**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

---

## 3. Solution Endpoints

### 3.1 Upload a Solution with YouTube URL Only (Protected)

**Request:**
- Method: `POST`
- URL: `http://localhost:5000/solutions`
- Headers: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- Body (form-data):
  - `questionId`: `QUESTION_ID_HERE` (Text)
  - `youtubeUrl`: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (Text)

**Expected Response:**
```json
{
  "success": true,
  "message": "Solution uploaded successfully",
  "data": {
    "_id": "...",
    "question": "...",
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "pdfUrl": null,
    "uploadedBy": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.2 Upload a Solution with PDF Only (Protected)

**Request:**
- Method: `POST`
- URL: `http://localhost:5000/solutions`
- Headers: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- Body (form-data):
  - `questionId`: `QUESTION_ID_HERE` (Text)
  - `pdf`: [Select File] - Choose a PDF file

**Expected Response:**
```json
{
  "success": true,
  "message": "Solution uploaded successfully",
  "data": {
    "_id": "...",
    "question": "...",
    "youtubeUrl": null,
    "pdfUrl": "http://localhost:5000/uploads/...",
    "uploadedBy": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.3 Upload a Solution with Both YouTube URL and PDF (Protected)

**Request:**
- Method: `POST`
- URL: `http://localhost:5000/solutions`
- Headers: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- Body (form-data):
  - `questionId`: `QUESTION_ID_HERE` (Text)
  - `youtubeUrl`: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (Text)
  - `pdf`: [Select File] - Choose a PDF file

**Expected Response:**
```json
{
  "success": true,
  "message": "Solution uploaded successfully",
  "data": {
    "_id": "...",
    "question": "...",
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "pdfUrl": "http://localhost:5000/uploads/...",
    "uploadedBy": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.4 Get All Solutions

**Request:**
- Method: `GET`
- URL: `http://localhost:5000/solutions`
- No headers required

**With Filter (by Question):**
- URL: `http://localhost:5000/solutions?questionId=QUESTION_ID_HERE`

**Expected Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "question": {
        "_id": "...",
        "school": "Coltech",
        "department": "Computer Science",
        "level": "Level 100",
        "subject": "Mathematics",
        "year": "2023"
      },
      "youtubeUrl": "https://www.youtube.com/watch?v=...",
      "pdfUrl": null,
      "uploadedBy": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 3.5 Get Single Solution

**Request:**
- Method: `GET`
- URL: `http://localhost:5000/solutions/SOLUTION_ID_HERE`
- Replace `SOLUTION_ID_HERE` with an actual solution ID

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "question": {
      "_id": "...",
      "school": "Coltech",
      "department": "Computer Science",
      "level": "Level 100",
      "subject": "Mathematics",
      "year": "2023",
      "pdfUrl": "http://localhost:5000/uploads/..."
    },
    "youtubeUrl": "https://www.youtube.com/watch?v=...",
    "pdfUrl": null,
    "uploadedBy": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.6 Delete a Solution (Protected, Owner Only)

**Request:**
- Method: `DELETE`
- URL: `http://localhost:5000/solutions/SOLUTION_ID_HERE`
- Headers: 
  - `Authorization: Bearer YOUR_TOKEN_HERE`
- Replace `SOLUTION_ID_HERE` with an actual solution ID

**Expected Response:**
```json
{
  "success": true,
  "message": "Solution deleted successfully"
}
```

---

## Testing Workflow

### Recommended Testing Order:

1. **Register a user** → Save the token
2. **Login** (optional, to verify login works) → Save the token
3. **Upload a question** → Save the question ID
4. **Get all questions** → Verify the question appears
5. **Get single question** → Verify it returns with empty solutions array
6. **Upload a solution (YouTube only)** → Save the solution ID
7. **Upload a solution (PDF only)** → Save the solution ID
8. **Upload a solution (Both)** → Save the solution ID
9. **Get all solutions** → Verify all solutions appear
10. **Get solutions by questionId** → Verify filtering works
11. **Get single solution** → Verify it returns correctly
12. **Get single question again** → Verify it now includes solutions
13. **Delete a solution** → Verify deletion works
14. **Delete a question** → Verify deletion works (should also delete associated solutions)

---

## Common Issues & Solutions

### Issue: "Cannot find module 'multer'"
**Solution:** Run `npm install` in the backend directory

### Issue: "MongoDB connection error"
**Solution:** Make sure MongoDB is running on your system

### Issue: "File too large"
**Solution:** PDF files must be under 10MB

### Issue: "Only PDF files are allowed"
**Solution:** Make sure you're uploading a PDF file, not another file type

### Issue: "Either YouTube URL or PDF URL must be provided"
**Solution:** For solutions, you must provide at least one of `youtubeUrl` or `pdf`

### Issue: "Not authorized"
**Solution:** Make sure you're including the `Authorization: Bearer YOUR_TOKEN` header for protected routes

### Issue: "Question not found"
**Solution:** Make sure you're using a valid question ID when uploading solutions

---

## Postman Collection Setup Tips

1. **Create Environment Variables:**
   - `base_url`: `http://localhost:5000`
   - `token`: (will be set after login/register)
   - `question_id`: (will be set after uploading a question)
   - `solution_id`: (will be set after uploading a solution)

2. **Use Pre-request Scripts:**
   - Automatically set the Authorization header using the `token` variable

3. **Use Tests Scripts:**
   - Automatically save tokens and IDs from responses to environment variables

Example Test Script (for login/register):
```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    var jsonData = pm.response.json();
    if (jsonData.token) {
        pm.environment.set("token", jsonData.token);
    }
    if (jsonData.data && jsonData.data._id) {
        pm.environment.set("question_id", jsonData.data._id);
    }
}
```

---

## Health Check

**Request:**
- Method: `GET`
- URL: `http://localhost:5000/`

**Expected Response:**
```json
{
  "message": "Student App Backend API is running"
}
```

If you see this, your server is running correctly!

