# API Endpoints Reference

**Base URL:** `http://localhost:3000/api`

---

## 🔐 Authentication Endpoints

| Method | Endpoint | Public | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | ✅ | Register new user |
| POST | `/auth/login` | ✅ | Login with email/matric |
| POST | `/auth/refresh-token` | ✅ | Refresh access token |
| POST | `/auth/logout` | ❌ | Logout and blacklist token |
| GET | `/auth/me` | ❌ | Get current user |

---

## 👨‍🎓 Student Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/students/profile` | student | Get student profile |
| PUT | `/students/profile` | student | Update student profile |
| GET | `/students/dashboard` | student | Get dashboard with stats |

---

## 📝 Log Entry Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/log-entries` | student | List log entries (paginated) |
| POST | `/log-entries` | student | Create new log entry |
| GET | `/log-entries/:id` | student | Get single entry |
| PUT | `/log-entries/:id` | student | Update entry (draft/pending) |
| PUT | `/log-entries/:id/submit` | student | Submit entry (draft → pending) |
| DELETE | `/log-entries/:id` | student | Delete entry (draft/pending) |

---

## 🔍 Supervisor Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/supervisors/dashboard` | supervisor, admin | Get supervisor dashboard |
| GET | `/supervisors/entries` | supervisor, admin | Get assigned entries (paginated) |
| PUT | `/supervisors/entries/:id/approve` | supervisor, admin | Approve entry with comment |
| PUT | `/supervisors/entries/:id/reject` | supervisor, admin | Reject entry with comment |
| GET | `/supervisors/students` | supervisor, admin | Get assigned students |
| GET | `/supervisors/students/:studentId/progress` | supervisor, admin | Get student progress |

---

## ⚙️ Admin Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/admin/dashboard` | admin | Get system dashboard |
| GET | `/admin/users` | admin | List users (paginated) |
| POST | `/admin/users` | admin | Create user |
| PUT | `/admin/users/:id` | admin | Update user |
| DELETE | `/admin/users/:id` | admin | Delete user (soft) |
| GET | `/admin/departments` | admin | List departments |
| POST | `/admin/departments` | admin | Create department |
| PUT | `/admin/departments/:id` | admin | Update department |
| DELETE | `/admin/departments/:id` | admin | Delete department |
| GET | `/admin/log-entries` | admin | Get all log entries |
| GET | `/admin/reports/export` | admin | Export entries as CSV |
| DELETE | `/admin/data/purge` | admin | Hard delete old entries |

---

## 🔔 Notification Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | all | Get notifications (paginated) |
| PUT | `/notifications/:id/read` | all | Mark notification as read |
| PUT | `/notifications/read-all` | all | Mark all as read |
| DELETE | `/notifications/:id` | all | Delete notification |

---

## 📁 File Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/files/upload/:entryId` | student, supervisor, admin | Upload files to entry |
| GET | `/files/:fileId` | student, supervisor, admin | Download file |
| DELETE | `/files/:fileId` | student, supervisor, admin | Delete file |
| GET | `/files/entry/:entryId` | student, supervisor, admin | Get entry files |

---

## 📋 Quick Reference

### Common Headers

**All Protected Endpoints:**
```
Authorization: Bearer <jwt_token>
```

**File Upload Endpoints:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### Query Parameters

**Pagination:**
```
?page=1&limit=10
```

**Filtering:**
```
?status=pending&is_read=false&type=approval
```

### Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Rate Limited |
| 500 | Server Error |

### File Constraints

- **Max Size:** 10 MB per file
- **Max Files:** 5 per request
- **Allowed Types:** PDF, JPEG, PNG, GIF, WEBP, DOCX, XLSX, TXT

### Rate Limits

- **Auth Endpoints:** 5 req/15 min
- **General Endpoints:** 100 req/1 hr

---

## 🧪 Quick Test Examples

### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "role": "student",
  "matric_number": "CSC/2021/001",
  "department": "Computer Science",
  "phone": "08012345678"
}
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "emailOrMatric": "john@example.com",
  "password": "SecurePass@123",
  "role": "student"
}
```

### Create Log Entry
```bash
POST /log-entries
Authorization: Bearer <token>
Content-Type: multipart/form-data

date: 2024-04-15
week_number: 15
activity_description: Worked on database optimization... (min 50 chars)
tools_equipment: PostgreSQL, pgAdmin... (min 10 chars)
skills_acquired: Database optimization... (min 10 chars)
challenges_faced: Complex query optimization... (min 10 chars)
files: <file1.pdf> <file2.jpg>
```

### Submit Entry
```bash
PUT /log-entries/:id/submit
Authorization: Bearer <token>
```

### Approve Entry
```bash
PUT /supervisors/entries/:id/approve
Authorization: Bearer <supervisor_token>
Content-Type: application/json

{
  "comment": "Excellent work!"
}
```

### Get Notifications
```bash
GET /notifications?page=1&limit=10&is_read=false
Authorization: Bearer <token>
```

### Export CSV
```bash
GET /admin/reports/export
Authorization: Bearer <admin_token>
```

---

## 🔄 Workflow Examples

### Student Workflow
1. **Register** → POST `/auth/register`
2. **Login** → POST `/auth/login` (get token)
3. **View Profile** → GET `/students/profile`
4. **Create Entry** → POST `/log-entries` (with files)
5. **Submit Entry** → PUT `/log-entries/:id/submit`
6. **Check Notifications** → GET `/notifications`
7. **View Dashboard** → GET `/students/dashboard`

### Supervisor Workflow
1. **Login** → POST `/auth/login` (get token)
2. **View Dashboard** → GET `/supervisors/dashboard`
3. **Get Assigned Entries** → GET `/supervisors/entries`
4. **Approve/Reject** → PUT `/supervisors/entries/:id/approve` or `/reject`
5. **View Student Progress** → GET `/supervisors/students/:studentId/progress`

### Admin Workflow
1. **Login** → POST `/auth/login` (get token)
2. **View Dashboard** → GET `/admin/dashboard`
3. **Manage Users** → GET/POST/PUT/DELETE `/admin/users`
4. **Export Entries** → GET `/admin/reports/export`
5. **View All Entries** → GET `/admin/log-entries`

---

## 📌 Important Notes

- All endpoints except `register`, `login`, `refresh-token` require JWT authentication
- File uploads limited to 5 files per request, 10MB each
- Soft deletes used for data recovery
- All admin actions are audit logged
- Notifications auto-trigger on entry submission/approval/rejection
- Role-based access control enforced on all protected endpoints

---

**Last Updated:** April 2024  
**Version:** 1.0.0
