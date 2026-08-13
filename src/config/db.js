// Database configuration
const { Pool } = require('pg');
const env = require('./env');

const poolConfig = env.db.url 
  ? { connectionString: env.db.url }
  : {
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
    };

// Enable SSL for production environments (Render, Neon, etc.) except internal Railway networks
if (env.nodeEnv === 'production') {
  const isInternalRailway = env.db.url && (env.db.url.includes('railway.internal') || env.db.url.includes('sslmode=disable'));
  if (!isInternalRailway && process.env.DB_SSL !== 'false') {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }
}

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
  process.exit(1);
});

/**
 * Run a query against the database
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool (for transactions)
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };