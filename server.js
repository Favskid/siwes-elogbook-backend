// Server entry point
const app = require('./src/app');
const env = require('./src/config/env');
const { pool } = require('./src/config/db');

const startServer = async () => {
  try {
    // Test DB connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified');

    app.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
      console.log(`📋 Environment: ${env.nodeEnv}`);
      console.log(`❤️  Health check: http://localhost:${env.port}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();