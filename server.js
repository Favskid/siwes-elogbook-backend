// Server entry point
const app = require('./src/app');
const env = require('./src/config/env');
const { pool } = require('./src/config/db');
const fs = require('fs');
const path = require('path');

const runSchema = async () => {
  const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('Running schema migration...');
  await pool.query(sql);
  console.log('Schema migration complete');
};

const startServer = async () => {
  try {
    // Test DB connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified');

    // Run schema migration on startup
    await runSchema();

    app.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
      console.log(`📋 Environment: ${env.nodeEnv}`);
      console.log(`❤️  Health check: http://localhost:${env.port}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message || err);
    console.error('   DATABASE_URL set:', !!process.env.DATABASE_URL);
    console.error('   NODE_ENV:', process.env.NODE_ENV);
    process.exit(1);
  }
};

startServer();