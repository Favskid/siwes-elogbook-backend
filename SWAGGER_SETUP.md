# Swagger API Documentation Setup Guide

## ✅ Installation & Setup Complete

Swagger/OpenAPI documentation has been successfully installed and configured in your SIWES E-Logbook backend.

---

## 🚀 Accessing Swagger Documentation

### Development Mode
```
http://localhost:3000/api-docs
```

### Production Mode
```
https://yourdomain.com/api-docs
```

### Swagger JSON Spec
```
http://localhost:3000/swagger.json
```

---

## 📦 What Was Installed

- **swagger-ui-express** - Express middleware for serving Swagger UI
- **swagger-jsdoc** - Library to generate OpenAPI specs from JSDoc comments

---

## 📝 Adding Swagger Documentation to Endpoints

### Example: Documenting an Endpoint

Add JSDoc comments directly above your route definitions:

```javascript
/**
 * @swagger
 * /students/profile:
 *   get:
 *     summary: Get student profile
 *     description: Retrieve the authenticated student's profile information
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: include_stats
 *         schema:
 *           type: boolean
 *         description: Include profile statistics
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authenticate, authorize('student'), getProfileController);
```

---

## 🏷️ Swagger Tags

Organize endpoints by creating tags:

```javascript
/**
 * @swagger
 * tags:
 *   - name: Students
 *     description: Student profile and dashboard endpoints
 *   - name: Log Entries
 *     description: Log entry CRUD operations
 *   - name: Supervisors
 *     description: Supervisor review and approval endpoints
 *   - name: Admin
 *     description: Administrative operations
 *   - name: Notifications
 *     description: Notification management
 *   - name: Files
 *     description: File upload and download
 */
```

---

## 🔐 Authentication Documentation

### Bearer Token (JWT)

```javascript
/**
 * @swagger
 * /protected-route:
 *   get:
 *     summary: Example protected endpoint
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
```

**In Swagger UI:** Click "Authorize" button, paste your JWT token with "Bearer " prefix.

---

## 📋 Common Swagger Patterns

### GET Endpoint with Query Parameters

```javascript
/**
 * @swagger
 * /log-entries:
 *   get:
 *     summary: List log entries
 *     tags: [Log Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, approved, rejected]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Entries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     entries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LogEntry'
 *                     pagination:
 *                       type: object
 */
router.get('/', authenticate, authorize('student'), listEntriesController);
```

### POST Endpoint with File Upload

```javascript
/**
 * @swagger
 * /log-entries:
 *   post:
 *     summary: Create log entry with file upload
 *     tags: [Log Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [date, week_number, activity_description]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Entry date (YYYY-MM-DD)
 *               week_number:
 *                 type: integer
 *                 description: Week number
 *               activity_description:
 *                 type: string
 *                 minLength: 50
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *                 description: Upload up to 5 files (10MB each)
 *     responses:
 *       201:
 *         description: Entry created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, authorize('student'), uploadLogEntryFiles, createEntryController);
```

### PUT Endpoint with Path Parameter

```javascript
/**
 * @swagger
 * /log-entries/{id}/approve:
 *   put:
 *     summary: Approve log entry
 *     tags: [Log Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment:
 *                 type: string
 *                 example: Excellent work!
 *     responses:
 *       200:
 *         description: Entry approved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id/approve', authenticate, authorize('supervisor', 'admin'), approveEntryController);
```

### DELETE Endpoint

```javascript
/**
 * @swagger
 * /log-entries/{id}:
 *   delete:
 *     summary: Delete log entry
 *     tags: [Log Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Entry deleted successfully
 *       404:
 *         description: Entry not found
 */
router.delete('/:id', authenticate, authorize('student'), deleteEntryController);
```

---

## 🔌 Reusable Schema References

Schemas are defined in `src/config/swagger.js`:

```javascript
// Reference in your endpoints:
data:
  $ref: '#/components/schemas/User'

// Or for arrays:
items:
  $ref: '#/components/schemas/LogEntry'
```

**Available Schemas:**
- `User` - User object with all properties
- `LogEntry` - Log entry with files
- `File` - File information
- `Notification` - Notification object
- `Error` - Standard error response
- `SuccessResponse` - Standard success response
- `PaginatedResponse` - Paginated list response

---

## 📄 How Swagger Configuration Works

### 1. **Swagger Config File**
Located in `src/config/swagger.js`:
- Defines API info, servers, security schemes
- Lists all route files to scan for JSDoc comments
- Defines reusable schemas and components

### 2. **Route Files**
Each route file (e.g., `auth.routes.js`) contains JSDoc comments above endpoints.

### 3. **App.js Integration**
```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec));
```

---

## 🔄 Workflow: Adding Documentation to a New Endpoint

### Step 1: Plan Your Endpoint
```javascript
// In students.routes.js
router.put('/profile', authenticate, authorize('student'), updateProfileController);
```

### Step 2: Add JSDoc Comment Above Route
```javascript
/**
 * @swagger
 * /students/profile:
 *   put:
 *     summary: Update student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticate, authorize('student'), updateProfileController);
```

### Step 3: Restart Server
The server will automatically pick up the new documentation.

### Step 4: Verify in Swagger UI
Visit `http://localhost:3000/api-docs` and look for your endpoint.

---

## 🧪 Testing in Swagger UI

### 1. Open Swagger UI
```
http://localhost:3000/api-docs
```

### 2. Authorize with Bearer Token
- Click "Authorize" button
- Paste your JWT token with "Bearer " prefix
- Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Try Out Endpoint
- Click the endpoint you want to test
- Click "Try it out"
- Fill in required parameters/body
- Click "Execute"
- View response

---

## 🎯 Common Response Patterns

### Success Response (200)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Created Response (201)
```json
{
  "success": true,
  "message": "Resource created",
  "data": { /* new resource */ }
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

---

## 📋 Next Steps: Document Remaining Endpoints

To fully document all endpoints, add JSDoc comments to these files:

1. ✅ `src/modules/auth/auth.routes.js` - **DONE**
2. `src/modules/students/students.routes.js`
3. `src/modules/log-entries/logEntries.routes.js`
4. `src/modules/supervisors/supervisors.routes.js`
5. `src/modules/admin/admin.routes.js`
6. `src/modules/notifications/notifications.routes.js`
7. `src/modules/files/files.routes.js`

### Template to Copy

```javascript
/**
 * @swagger
 * /path:
 *   method:
 *     summary: Brief description
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: param_name
 *         schema:
 *           type: type
 *         description: Description
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: type
 *     responses:
 *       200:
 *         description: Success message
 *       401:
 *         description: Unauthorized
 */
```

---

## 🔒 Security in Swagger

### Marking Endpoints as Protected
```javascript
/**
 * @swagger
 * /some-endpoint:
 *   get:
 *     security:
 *       - bearerAuth: []
 */
```

### Optional Authentication
```javascript
/**
 * @swagger
 * /some-endpoint:
 *   get:
 *     security:
 *       - bearerAuth: []
 *       - {}  # Also allow requests without authentication
 */
```

### No Authentication Required
Omit the `security` property entirely.

---

## 📞 Troubleshooting

### Swagger UI Shows 404
**Solution:** Verify swagger is running on `/api-docs`
```bash
curl http://localhost:3000/api-docs
```

### Endpoints Not Appearing
**Solution:** 
1. Check JSDoc syntax (starts with `/**` and ends with `*/`)
2. Verify route file is listed in `src/config/swagger.js` under `apis`
3. Restart the server

### Schema Reference Not Working
**Solution:** Use correct reference format:
```javascript
$ref: '#/components/schemas/SchemaName'
```

### Bearer Token Not Working
**Solution:**
1. Click "Authorize" in Swagger UI
2. Paste token with "Bearer " prefix
3. Make sure token is not expired

---

## 📖 Additional Resources

- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [Swagger Documentation Best Practices](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express Documentation](https://github.com/scottie1984/swagger-ui-express)

---

## 🎉 You're Ready!

Your API is now documented with Swagger! 

**Quick Start:**
1. Start server: `npm run dev`
2. Open browser: `http://localhost:3000/api-docs`
3. Click "Authorize", paste token
4. Test endpoints directly in Swagger UI!

---

**Version:** 1.0.0  
**Last Updated:** April 2024  
**Status:** Ready for Use ✅
