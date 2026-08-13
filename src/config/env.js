// Environment configuration
// Railway injects vars directly into process.env before the app starts.
// We call dotenv with override:false so Railway vars are never overwritten.
require('dotenv').config({ override: false });

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    url: process.env.DATABASE_URL, // Primary for production (Render/Neon)
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'siwes_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN) || 86400,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 604800,
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    maxFiles: parseInt(process.env.MAX_FILES_PER_ENTRY) || 5,
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  frontendUrl: (() => {
    const defaultOrigin = 'http://localhost:5173';
    const envOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(u => u.trim()).filter(Boolean)
      : [];
    return [defaultOrigin, ...envOrigins];
  })(),
};