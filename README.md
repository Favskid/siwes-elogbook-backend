# SIWES E-Logbook Backend API

A comprehensive backend system for managing SIWES (Students Industrial Work Experience Scheme) electronic logbooks. Built with Node.js, Express, PostgreSQL, and JWT authentication.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Students](#students)
  - [Log Entries](#log-entries)
  - [Supervisors](#supervisors)
  - [Admin](#admin)
  - [Notifications](#notifications)
  - [Files](#files)
- [Authentication & Authorization](#authentication--authorization)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [File Upload](#file-upload)
- [Security Features](#security-features)
- [Project Structure](#project-structure)
- [Testing Workflow](#testing-workflow)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Functionality
✅ **User Authentication** - JWT tokens with refresh mechanism  
✅ **Role-Based Access Control** - 4 user roles (student, industry_supervisor, school_supervisor, admin)  
✅ **Student Management** - Profiles, dashboards, progress tracking  
✅ **Log Entry System** - Full CRUD with status workflow (draft → pending → approved/rejected)  
✅ **File Uploads** - Multer integration with validation (max 10MB, 5 files per entry)  
✅ **Supervisor Workflow** - Entry approval/rejection with comments and notifications  
✅ **Admin Dashboard** - System-wide statistics and user management  
✅ **Audit Logging** - Track all admin actions  
✅ **Notifications System** - Auto-triggered on entry events  
✅ **CSV Export** - Export log entries for reporting  

### Security
✅ Password hashing with bcryptjs (12 rounds)  
✅ JWT-based authentication with token blacklisting  
✅ Rate limiting (auth: 5 req/15min, general: 100 req/hr)  
✅ CORS protection  
✅ Input sanitization (XSS prevention)  
✅ Helmet HTTP security headers  
✅ Database constraints and triggers  
✅ Soft deletes (data recovery)  

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL 12+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Morgan
- **Environment**: dotenv
- **UUID**: uuid v4

---

## 📦 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v12.0 or higher
- **Git**: For version control

**Verify installations:**
```bash
node --version    # v18.x.x
npm --version     # 9.x.x
psql --version    # psql 12.x or higher
```

---

## 🚀 Installation

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd siwes-elogbook-backend
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all packages from `package.json`:
- express, cors, helmet, morgan
- jsonwebtoken, bcryptjs, uuid
- pg (PostgreSQL client)
- multer (file upload)
- express-rate-limit
- dotenv (environment variables)
- nodemon (development)

### Step 3: Verify Installation
```bash
npm list --depth=0
```

---

## ⚙️ Environment Configuration

### Step 1: Copy Example File
```bash
cp .env.example .env
```

### Step 2: Configure Environment Variables

Edit `.env` with your values:

```env
# ─── Core Configuration ───────────────────────────────────────
PORT=3000
NODE_ENV=development

# ─── Database Configuration ───────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=siwes_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# ─── JWT Configuration ────────────────────────────────────────
# Generate with: openssl rand -base64 32
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long_change_this
JWT_EXPIRES_IN=7d

JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_chars_long_change_this
JWT_REFRESH_EXPIRES_IN=30d

# ─── File Upload Configuration ────────────────────────────────
MAX_FILE_SIZE=10485760
MAX_FILES_PER_ENTRY=5
UPLOAD_DIR=uploads

# ─── Frontend Configuration ───────────────────────────────────
FRONTEND_URL=http://localhost:5173
```

### Step 3: Generate Secure JWT Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32
```

Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database

**Using psql (command line):**
```bash
psql -U postgres
CREATE DATABASE siwes_db;
\q
```

**OR Using pgAdmin (GUI):**
1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `siwes_db`
4. Click "Save"

### Step 2: Initialize Database Schema

```bash
# Run schema setup
npm run db:schema

# Output should show:
# ✅ Database schema created successfully
```

This creates:
- users table
- departments table
- log_entries table
- files table
- notifications table
- audit_logs table
- token_blacklist table
- Indexes for performance
- Triggers for auto-timestamps

### Step 3: Seed Sample Data (Optional)

```bash
npm run db:seed

# Output should show:
# ✅ Database seeded successfully
```

**Verify Database:**
```bash
psql -U postgres -d siwes_db -c "\dt"
```

---

## ▶️ Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

**Expected output:**
```
✅ Connected to PostgreSQL database
✅ Database connection verified
🚀 Server running on http://localhost:3000
📋 Environment: development
❤️  Health check: http://localhost:3000/health
```

### Production Mode
```bash
npm start
```

### Check Server Health
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "success": true,
  "message": "SIWES E-Logbook API is running",
  "environment": "development",
  "timestamp": "2024-04-15T10:30:00.000Z"
}
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

All endpoints require authentication (JWT token) unless marked as public.

### Response Format

**Success Response (2xx):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

---

## 🔐 Authentication

### Register (Public)

**Endpoint:** `POST /auth/register`

**Body:**
```json
{
  "name": "John Student",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "role": "student",
  "matric_number": "CSC/2021/001",
  "department": "Computer Science",
  "phone": "08012345678"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "uuid...",
      "name": "John Student",
      "email": "john@example.com",
      "role": "student",
      "matric_number": "CSC/2021/001"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "7d"
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&^#-_)

### Login (Public)

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "emailOrMatric": "john@example.com",
  "password": "SecurePass@123",
  "role": "student"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user data */ },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "7d"
  }
}
```

### Refresh Token (Public)

**Endpoint:** `POST /auth/refresh-token`

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": "7d"
  }
}
```

### Logout (Protected)

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

### Get Current User (Protected)

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

---

## 👨‍🎓 Students

### Get Profile

**Endpoint:** `GET /students/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student profile retrieved successfully",
  "data": {
    "id": "uuid...",
    "name": "John Student",
    "email": "john@example.com",
    "role": "student",
    "matric_number": "CSC/2021/001",
    "department": "Computer Science",
    "phone": "08012345678",
    "is_active": true,
    "created_at": "2024-04-15T10:30:00Z"
  }
}
```

### Update Profile

**Endpoint:** `PUT /students/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Updated",
  "phone": "08087654321",
  "avatar": "base64_image_or_url"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student profile updated successfully",
  "data": { /* updated user data */ }
}
```

### Get Dashboard

**Endpoint:** `GET /students/dashboard`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student dashboard retrieved successfully",
  "data": {
    "stats": {
      "total": 15,
      "approved": 10,
      "pending": 3,
      "draft": 2,
      "rejected": 0
    },
    "recentEntries": [ /* last 5 entries */ ],
    "unreadNotifications": {
      "count": 3,
      "items": [ /* unread notifications */ ]
    }
  }
}
```

---

## 📝 Log Entries

### Create Entry (with File Upload)

**Endpoint:** `POST /log-entries`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
date: 2024-04-15
week_number: 15
activity_description: Worked on database optimization. Implemented proper indexing strategies and analyzed execution plans to improve system performance significantly. [min 50 chars]
tools_equipment: PostgreSQL, pgAdmin, DBeaver, analysis tools [min 10 chars]
skills_acquired: Database optimization, query profiling, index management [min 10 chars]
challenges_faced: Complex query optimization required deep analysis of execution plans [min 10 chars]
files: [file1.pdf, file2.jpg] (max 5 files, 10MB each)
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Log entry created successfully",
  "data": {
    "id": "uuid...",
    "student_id": "uuid...",
    "date": "2024-04-15",
    "week_number": 15,
    "activity_description": "...",
    "status": "draft",
    "files": [
      {
        "id": "uuid...",
        "file_name": "uuid_filename.pdf",
        "original_name": "filename.pdf",
        "url": "/uploads/log-entries/uuid_filename.pdf",
        "file_size": 45000
      }
    ],
    "created_at": "2024-04-15T10:30:00Z"
  }
}
```

### List Entries

**Endpoint:** `GET /log-entries`

**Query Parameters:**
```
page=1              # Page number (default: 1)
limit=10            # Items per page (default: 10)
status=pending      # Filter by status (draft, pending, approved, rejected)
week_number=15      # Filter by week
date_from=2024-01-01  # Filter by date range
date_to=2024-12-31
```

**Example:**
```bash
curl "http://localhost:3000/api/log-entries?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Log entries retrieved successfully",
  "data": {
    "entries": [ /* array of entries */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Get Single Entry

**Endpoint:** `GET /log-entries/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Log entry retrieved successfully",
  "data": { /* entry with files */ }
}
```

### Update Entry

**Endpoint:** `PUT /log-entries/:id`

**Requirements:**
- Entry must be in `draft` or `pending` status
- Entry must belong to authenticated user

**Body:**
```json
{
  "date": "2024-04-16",
  "week_number": 16,
  "activity_description": "Updated description with at least 50 characters..."
}
```

### Submit Entry (Draft → Pending)

**Endpoint:** `PUT /log-entries/:id/submit`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Log entry submitted successfully",
  "data": { "status": "pending", ... }
}
```

This triggers a notification to the student.

### Delete Entry

**Endpoint:** `DELETE /log-entries/:id`

**Requirements:**
- Entry must be `draft` or `pending`
- Entry must belong to authenticated user

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Log entry deleted successfully",
  "data": null
}
```

---

## 🔍 Supervisors

**Role:** `industry_supervisor` or `school_supervisor`

### Get Dashboard

**Endpoint:** `GET /supervisors/dashboard`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Supervisor dashboard retrieved successfully",
  "data": {
    "stats": {
      "total": 45,
      "pending": 12,
      "approved": 30,
      "rejected": 3
    },
    "assignedStudentsCount": 15
  }
}
```

### Get Assigned Entries

**Endpoint:** `GET /supervisors/entries`

**Query Parameters:**
```
page=1
limit=10
status=pending
```

### Approve Entry

**Endpoint:** `PUT /supervisors/entries/:id/approve`

**Body:**
```json
{
  "comment": "Excellent work! The implementation shows strong understanding of database optimization principles."
}
```

**Triggers:**
- Entry status → `approved`
- Notification sent to student with comment

### Reject Entry

**Endpoint:** `PUT /supervisors/entries/:id/reject`

**Body:**
```json
{
  "comment": "Please revise the activity description. It needs more detail about the techniques used."
}
```

**Required:** Comment must be provided

**Triggers:**
- Entry status → `draft` (reverted for editing)
- Notification sent to student with comment

### Get Assigned Students

**Endpoint:** `GET /supervisors/students`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Assigned students retrieved successfully",
  "data": [
    {
      "id": "uuid...",
      "name": "Jane Student",
      "matric_number": "CSC/2021/005",
      "email": "jane@example.com",
      "department": "Computer Science"
    }
  ]
}
```

### Get Student Progress

**Endpoint:** `GET /supervisors/students/:studentId/progress`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student progress retrieved successfully",
  "data": {
    "student": { /* student info */ },
    "stats": {
      "total": 20,
      "approved": 15,
      "pending": 3,
      "draft": 2,
      "rejected": 0
    },
    "recentEntries": [ /* 10 most recent entries */ ]
  }
}
```

---

## ⚙️ Admin

**Role:** `admin` only

### Get Dashboard

**Endpoint:** `GET /admin/dashboard`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin dashboard retrieved successfully",
  "data": {
    "users": {
      "total": 150,
      "students": 120
    },
    "logEntries": {
      "total": 450,
      "pending": 25
    },
    "notifications": {
      "unread": 8
    },
    "files": {
      "total": 300,
      "totalSize": 2500000000
    }
  }
}
```

### List Users

**Endpoint:** `GET /admin/users`

**Query Parameters:**
```
page=1
limit=10
role=student           # Filter by role
is_active=true         # Filter by active status
```

### Create User

**Endpoint:** `POST /admin/users`

**Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "TempPass@123",
  "role": "school_supervisor",
  "department": "Computer Science",
  "phone": "08012345678"
}
```

**Logs:** Audit entry created

### Update User

**Endpoint:** `PUT /admin/users/:id`

**Body:**
```json
{
  "name": "Updated Name",
  "phone": "08087654321",
  "is_active": true,
  "department": "Engineering"
}
```

**Logs:** Audit entry created

### Delete User (Soft)

**Endpoint:** `DELETE /admin/users/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

**Note:** Data not permanently deleted (soft delete)

### List Departments

**Endpoint:** `GET /admin/departments`

### Create Department

**Endpoint:** `POST /admin/departments`

**Body:**
```json
{
  "name": "Computer Science",
  "code": "CSC",
  "supervisor_id": "uuid..." // optional
}
```

### Update Department

**Endpoint:** `PUT /admin/departments/:id`

### Delete Department

**Endpoint:** `DELETE /admin/departments/:id`

### Get All Log Entries

**Endpoint:** `GET /admin/log-entries`

**Query Parameters:**
```
page=1
limit=10
status=pending
student_id=uuid...
week_number=15
```

### Export Entries (CSV)

**Endpoint:** `GET /admin/reports/export`

**Response:**
- File download: `log_entries_export.csv`
- Includes all entries with student details, dates, and statuses

### Purge Old Data

**Endpoint:** `DELETE /admin/data/purge`

**Body:**
```json
{
  "daysOld": 365  // Hard delete entries older than 365 days
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Old data purged successfully",
  "data": {
    "message": "Purged 42 entries",
    "daysOld": 365,
    "cutoffDate": "2023-04-15T00:00:00Z"
  }
}
```

**Logs:** Audit entry created with count

---

## 🔔 Notifications

### Get Notifications

**Endpoint:** `GET /notifications`

**Query Parameters:**
```
page=1
limit=10
is_read=false       # Filter unread only
type=approval       # Filter by type (approval, rejection, feedback, submission, info)
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "uuid...",
        "title": "Entry Approved",
        "message": "Your log entry has been approved.",
        "type": "approval",
        "is_read": false,
        "related_entry_id": "uuid...",
        "created_at": "2024-04-15T10:30:00Z"
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### Mark as Read

**Endpoint:** `PUT /notifications/:id/read`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": { /* updated notification */ }
}
```

### Mark All as Read

**Endpoint:** `PUT /notifications/read-all`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": null
}
```

### Delete Notification

**Endpoint:** `DELETE /notifications/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": null
}
```

---

## 📁 Files

### Upload File

**Endpoint:** `POST /files/upload/:entryId`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
files: [file1.pdf, file2.jpg]  # Up to 5 files, 10MB max each
```

**Allowed Types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, Word (.doc, .docx), Excel (.xls, .xlsx)
- Text: TXT

**Response (201 Created):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "uuid...",
    "file_name": "uuid_filename.pdf",
    "original_name": "filename.pdf",
    "file_type": "application/pdf",
    "file_size": 45000,
    "url": "/uploads/log-entries/uuid_filename.pdf",
    "created_at": "2024-04-15T10:30:00Z"
  }
}
```

### Download File

**Endpoint:** `GET /files/:fileId`

**Response:**
- File binary download
- Access verified and restricted

### Delete File

**Endpoint:** `DELETE /files/:fileId`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": null
}
```

Deletes from disk and database.

### Get Entry Files

**Endpoint:** `GET /files/entry/:entryId`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Entry files retrieved successfully",
  "data": [ /* array of files for entry */ ]
}
```

---

## 🔐 Authentication & Authorization

### Roles

```
├── student                  (Regular user)
├── industry_supervisor      (Review entries, manage students)
├── school_supervisor        (Review entries, manage department)
└── admin                    (Full system access)
```

### Using JWT Token

**Add to all protected requests:**

```bash
curl -X GET http://localhost:3000/api/students/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "student",
  "iat": 1640000000,
  "exp": 1640604800
}
```

### Token Expiration

- **Access Token**: 7 days (configurable)
- **Refresh Token**: 30 days (configurable)

When access token expires, use refresh token to get a new one without re-authenticating.

---

## ❌ Error Handling

### Common Status Codes

```
200 OK                 - Request successful
201 Created            - Resource created
400 Bad Request        - Validation error
401 Unauthorized       - Authentication required
403 Forbidden          - Insufficient permissions
404 Not Found          - Resource not found
409 Conflict           - Resource already exists
413 Payload Too Large  - File too large
429 Too Many Requests  - Rate limit exceeded
500 Server Error       - Internal error
```

### Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Activity description must be at least 50 characters",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_REQUIRED` | Missing or invalid token |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource doesn't exist |
| `CONFLICT` | Resource already exists |
| `RATE_LIMITED` | Too many requests |
| `FILE_TOO_LARGE` | File exceeds 10MB |
| `INVALID_FILE_TYPE` | File type not allowed |

---

## ⏱️ Rate Limiting

### Limits

**Authentication Endpoints:**
- 5 requests per 15 minutes per IP
- Applies to: /auth/register, /auth/login, /auth/refresh-token

**All API Endpoints:**
- 100 requests per 1 hour per IP
- Applies to all /api/* routes

### Rate Limit Headers

All responses include:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640604800
```

### When Limit Exceeded

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "details": {}
  }
}
```

HTTP Status: 429

---

## 📤 File Upload

### Constraints

| Constraint | Value |
|------------|-------|
| Max file size | 10 MB |
| Max files per request | 5 |
| Storage location | `/uploads/log-entries/` |
| Allowed types | PDF, Images, Documents |

### Allowed MIME Types

```
image/jpeg
image/png
image/gif
image/webp
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.ms-excel
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
text/plain
```

### File Naming

Files are stored with UUID-based filenames to prevent collisions:
```
UUID_original_filename.ext
Example: 550e8400-e29b-41d4-a716-446655440000_report.pdf
```

### Access Control

- Student can download own files
- Supervisor can download files from entries they reviewed
- Admin has access to all files

---

## 🔒 Security Features

### Password Security

✅ Bcryptjs hashing (12 rounds)  
✅ Password strength validation  
✅ Never stored in plain text  

### Token Security

✅ JWT with HMAC-SHA256  
✅ Token blacklisting on logout  
✅ Automatic token expiration  
✅ Refresh token rotation  

### Input Security

✅ XSS prevention (input sanitization)  
✅ SQL injection prevention (parameterized queries)  
✅ Request validation  
✅ File type validation  

### HTTP Security

✅ Helmet headers (CSP, HSTS, X-Frame-Options, etc.)  
✅ CORS protection (whitelisted origins)  
✅ Rate limiting  

### Database Security

✅ Foreign key constraints  
✅ Role-based constraints  
✅ Soft deletes (data recovery)  
✅ Audit logging  
✅ Encrypted connections (configurable)  

---

## 📁 Project Structure

```
siwes-elogbook-backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.routes.js
│   │   ├── students/
│   │   │   ├── students.controller.js
│   │   │   ├── students.service.js
│   │   │   └── students.routes.js
│   │   ├── log-entries/
│   │   │   ├── logEntries.controller.js
│   │   │   ├── logEntries.service.js
│   │   │   └── logEntries.routes.js
│   │   ├── supervisors/
│   │   │   ├── supervisors.controller.js
│   │   │   ├── supervisors.service.js
│   │   │   └── supervisors.routes.js
│   │   ├── admin/
│   │   │   ├── admin.controller.js
│   │   │   ├── admin.service.js
│   │   │   └── admin.routes.js
│   │   ├── notifications/
│   │   │   ├── notifications.controller.js
│   │   │   ├── notifications.service.js
│   │   │   └── notifications.routes.js
│   │   └── files/
│   │       ├── files.controller.js
│   │       ├── files.service.js
│   │       └── files.routes.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── rbac.js              # Role authorization
│   │   ├── errorHandler.js      # Error handling
│   │   ├── rateLimiter.js       # Rate limiting
│   │   ├── uploadHandler.js     # File upload
│   │   └── sanitization.js      # XSS prevention
│   ├── services/
│   │   └── notificationService.js  # Auto-triggered notifications
│   ├── utils/
│   │   ├── helpers.js           # Validation & utilities
│   │   └── response.js          # Response formatting
│   ├── config/
│   │   ├── db.js                # Database connection
│   │   └── env.js               # Environment variables
│   ├── db/
│   │   ├── schema.sql           # Database schema
│   │   ├── seed.sql             # Sample data
│   │   └── runSQL.js            # SQL runner
│   ├── app.js                   # Express configuration
│   └── server.js                # Server entry point
├── uploads/                     # File storage
├── .env.example                 # Environment template
├── package.json
├── package-lock.json
└── README.md
```

---

## 🧪 Testing Workflow

### Complete Workflow Example

**1. Register Student Account:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "StudentPass@2024",
    "role": "student",
    "matric_number": "CSC/2021/012",
    "department": "Computer Science",
    "phone": "08012345678"
  }'
```

**Save the token from response.**

**2. Create Log Entry:**
```bash
curl -X POST http://localhost:3000/api/log-entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "date=2024-04-15" \
  -F "week_number=15" \
  -F "activity_description=Today I worked extensively on implementing database query optimization techniques. The team conducted a thorough analysis of slow queries and implemented proper indexing strategies to improve system performance significantly." \
  -F "tools_equipment=PostgreSQL 14, pgAdmin, DBeaver, Query analysis tools" \
  -F "skills_acquired=Query optimization, Index design, Database performance tuning, Execution plan analysis" \
  -F "challenges_faced=Identifying optimal index combinations required careful analysis of query patterns and trade-offs to balance read and write performance" \
  -F "files=@/path/to/sample.pdf"
```

**Save the entry ID from response.**

**3. View Dashboard:**
```bash
curl -X GET http://localhost:3000/api/students/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**4. Submit Entry (triggers notification):**
```bash
curl -X PUT http://localhost:3000/api/log-entries/ENTRY_ID/submit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**5. Supervisor Approves Entry:**
```bash
# Register supervisor account (role: school_supervisor)
# Modify department to match student's department

curl -X PUT http://localhost:3000/api/supervisors/entries/ENTRY_ID/approve \
  -H "Authorization: Bearer SUPERVISOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Excellent work! The optimization strategies demonstrate strong understanding of database performance principles."
  }'
```

**6. Check Notifications:**
```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Troubleshooting

### Server Won't Start

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check PostgreSQL is running
psql -U postgres

# If not running, start PostgreSQL
# Windows: Open Services, find PostgreSQL, restart
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

**Error**: `Error: database "siwes_db" does not exist`

**Solution:**
```bash
# Create database
npm run db:schema
```

### JWT Token Errors

**Error**: `Authentication token is required`

**Solution:**
```bash
# Include Authorization header with Bearer token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/students/profile
```

**Error**: `Invalid token` or `Token has expired`

**Solution:**
```bash
# Get new token using refresh token
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### File Upload Issues

**Error**: `File size exceeds 10MB limit`

**Solution:** Use files smaller than 10MB

**Error**: `File type not allowed`

**Solution:** Use allowed types (PDF, PNG, JPG, GIF, WEBP, DOCX, XLSX, TXT)

### Rate Limiting Issues

**Error**: `Too many requests`

**Solution:** Wait 15 minutes for auth endpoints or 1 hour for general endpoints

### Database Issues

**Error**: `Duplicate key value violates unique constraint`

**Solution:** Email or matric number already exists. Use different values.

**Error**: `violates foreign key constraint`

**Solution:** Resource doesn't exist. Verify IDs are correct.

---

## 📝 Development Guidelines

### Adding New Endpoints

1. Create service function in module service file
2. Create controller in module controller file
3. Add route to module routes file
4. Wire route into app.js
5. Test with curl or Postman

### Code Style

```javascript
// Use const for immutable values
const value = 123;

// Use async/await for promises
const result = await query(sql, params);

// Use parameterized queries (pg)
await query('SELECT * FROM users WHERE id = $1', [id]);

// Never concatenate SQL strings
// ❌ Wrong: 'SELECT * FROM users WHERE id = ' + id
// ✅ Right: 'SELECT * FROM users WHERE id = $1', [id]
```

### Database Queries

All queries must be parameterized using the `query()` function from `src/config/db.js`:

```javascript
// Safe - parameterized
await query(
  'SELECT * FROM users WHERE email = $1 AND role = $2',
  [email, role]
);
```

---

## 🚀 Deployment

### Environment Setup for Production

```env
NODE_ENV=production
PORT=3000
DB_HOST=production-db-host
DB_NAME=siwes_db_prod
DB_USER=prod_user
DB_PASSWORD=strong_password_here
JWT_SECRET=production_jwt_secret_32_chars_min
JWT_REFRESH_SECRET=production_refresh_secret_32_chars_min
FRONTEND_URL=https://yourdomain.com
```

### Deployment Checklist

- [ ] Create PostgreSQL database on production server
- [ ] Run `npm run db:schema` to initialize schema
- [ ] Set all environment variables in .env
- [ ] Generate strong JWT secrets
- [ ] Update FRONTEND_URL to production domain
- [ ] Use HTTPS only
- [ ] Enable CORS for production domain only
- [ ] Set NODE_ENV=production
- [ ] Run `npm install --production`
- [ ] Use process manager (PM2, systemd, etc.)
- [ ] Set up regular backups
- [ ] Monitor logs and errors

---

## 📞 Support & Contribution

### Issues & Bugs

1. Check [Troubleshooting](#troubleshooting) section
2. Check database connection and schema
3. Review error logs in console
4. Verify JWT tokens are valid

### Contributing

1. Create a new branch for each feature
2. Follow code style guidelines
3. Add appropriate error handling
4. Test endpoints with curl before committing
5. Update documentation if adding endpoints

---

## 📄 License

This project is proprietary and part of the SIWES E-Logbook system.

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [JWT Introduction](https://jwt.io)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🎯 Quick Reference

**Default Credentials (Dev Only):**
```
Email: admin@siwes.localhost
Password: ChangeMe@123
Role: admin
```

**API Base URL:**
```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

**Common Endpoints:**
```
Health Check: http://localhost:3000/health
API Documentation: This README
```

**Useful Commands:**
```bash
npm run dev           # Start development server
npm start             # Start production server
npm run db:schema     # Initialize database
npm run db:seed       # Seed sample data
npm run db:reset      # Reset database (dev only)
```

---

**Version:** 1.0.0  
**Last Updated:** April 2024  
**Status:** Production Ready ✅
