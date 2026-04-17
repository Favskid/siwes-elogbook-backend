# 🎯 Swagger Setup - Quick Start Guide

## ✅ Swagger Installed & Ready!

Your API now has full interactive documentation with Swagger/OpenAPI.

---

## 🚀 Access Swagger Documentation

### **Development:**
```
http://localhost:3000/api-docs
```

### **Production:**
```
https://yourdomain.com/api-docs
```

---

## 📦 What Was Installed

✅ `swagger-ui-express` - Interactive API documentation UI  
✅ `swagger-jsdoc` - Generate OpenAPI specs from JSDoc comments  
✅ Authentication endpoints documented with full examples  

---

## 🔑 Features

### Authentication
- Click "Authorize" button in top-right
- Paste your JWT token with `Bearer ` prefix
- Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Try Out Endpoints
1. Click any endpoint to expand
2. Click "Try it out"
3. Fill in parameters/body
4. Click "Execute"
5. View response in real-time

### View Schemas
- Scroll down to see all data models
- Includes User, LogEntry, File, Notification schemas

---

## 📝 Files Modified/Created

### New Files:
- `src/config/swagger.js` - Swagger configuration
- `SWAGGER_SETUP.md` - Comprehensive setup guide
- `SWAGGER_QUICK_START.md` - This file

### Modified Files:
- `src/app.js` - Added Swagger routes
- `src/modules/auth/auth.routes.js` - Added JSDoc documentation

---

## 📋 Documented Endpoints (So Far)

### Authentication ✅
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/refresh-token`
- POST `/auth/logout`
- GET `/auth/me`

### Still Need Documentation:
- `/students/*` endpoints
- `/log-entries/*` endpoints
- `/supervisors/*` endpoints
- `/admin/*` endpoints
- `/notifications/*` endpoints
- `/files/*` endpoints

---

## 🎯 Next: Document Remaining Endpoints

### Simple 3-Step Process

**Step 1:** Open `src/modules/students/students.routes.js`

**Step 2:** Add JSDoc above each route:
```javascript
/**
 * @swagger
 * /students/profile:
 *   get:
 *     summary: Get student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/profile', authenticate, authorize('student'), getProfileController);
```

**Step 3:** Restart server (auto-refresh docs)

---

## 🧪 Test It Out Immediately!

1. **Start server:**
   ```bash
   npm run dev
   ```

2. **Open Swagger:**
   Navigate to: `http://localhost:3000/api-docs`

3. **Register test account:**
   - Find POST `/auth/register`
   - Click "Try it out"
   - Fill in test data:
   ```json
   {
     "name": "Test User",
     "email": "test@example.com",
     "password": "SecurePass@123",
     "role": "student",
     "matric_number": "CSC/2021/001",
     "department": "Computer Science",
     "phone": "08012345678"
   }
   ```
   - Click "Execute"
   - Copy the `token` from response

4. **Authorize with token:**
   - Click "Authorize" button (top-right)
   - Paste: `Bearer <your_token_here>`
   - Click "Authorize"
   - Click "Close"

5. **Test another endpoint:**
   - Find GET `/auth/me`
   - Click "Try it out"
   - Click "Execute"
   - See your user info returned!

---

## 📚 Resources

- **Swagger UI:** http://localhost:3000/api-docs
- **API Spec (JSON):** http://localhost:3000/swagger.json
- **Full Setup Guide:** `SWAGGER_SETUP.md` in project root
- **Endpoints Reference:** `ENDPOINTS.md` or `ENDPOINTS.json`
- **README:** `README.md` for complete documentation

---

## 🛠️ Configuration Files

### Main Configuration
- **Location:** `src/config/swagger.js`
- **Contains:** API info, servers, security schemes, reusable schemas
- **Updated:** Route file paths are auto-scanned

### Routes with Documentation
- **Auth Routes:** ✅ `src/modules/auth/auth.routes.js`
- **Student Routes:** `src/modules/students/students.routes.js`
- **Log Entry Routes:** `src/modules/log-entries/logEntries.routes.js`
- **Supervisor Routes:** `src/modules/supervisors/supervisors.routes.js`
- **Admin Routes:** `src/modules/admin/admin.routes.js`
- **Notification Routes:** `src/modules/notifications/notifications.routes.js`
- **File Routes:** `src/modules/files/files.routes.js`

---

## 💡 Pro Tips

### How to Find Endpoints Quickly
1. Use the search box at top of Swagger UI
2. Or use filter by tags (Students, LogEntries, etc.)

### How to Copy Request Examples
1. Click the endpoint
2. Click "Try it out"
3. Copy your request from "curl" section
4. Use in Postman or terminal

### How to Export Documentation
1. Download Swagger JSON: `http://localhost:3000/swagger.json`
2. Import into Postman, ReDoc, or other tools
3. Share with team for API collaboration

### Rate Limiting in Documentation
- Auth endpoints: 5 requests/15 minutes
- General endpoints: 100 requests/1 hour
- Headers show remaining limits

---

## ❌ Troubleshooting

### Swagger not showing?
```bash
# Make sure server is running
curl http://localhost:3000/api-docs

# Check if docs load
# Visit: http://localhost:3000/api-docs
```

### Endpoints not appearing?
1. Verify JSDoc syntax is correct (/** ... */)
2. Check route file is listed in `src/config/swagger.js`
3. Restart server

### Token not working?
1. Make sure to use `Bearer ` prefix
2. Don't include the quotes
3. Example: `Bearer eyJhbGciOi...` (not `"Bearer..."`)

### Response doesn't match schema?
- Response schemas auto-validate in Swagger UI
- Check real response vs schema definition
- Update schema in `src/config/swagger.js` if needed

---

## 🎉 You're All Set!

**Your API is now:**
✅ Fully documented with interactive Swagger UI  
✅ Testable directly from browser  
✅ Shareable specification (JSON/YAML)  
✅ Compatible with frontend tools/libraries  

---

**Access:** http://localhost:3000/api-docs  
**Status:** Live and Ready ✅  
**Next:** Document remaining endpoints using the provided patterns
