require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

const runFile = async (filePath) => {
  const fileName = path.basename(filePath);
  console.log(`⏳ Running SQL script: ${fileName}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  try {
    await pool.query(sql);
    console.log(`✅ Successfully ran: ${fileName}`);
  } catch (err) {
    console.error(`❌ Error running ${fileName}:`);
    console.error(`   Message: ${err.message}`);
    if (err.detail) console.error(`   Detail: ${err.detail}`);
    if (err.where) console.error(`   Where: ${err.where}`);
    throw err;
  }
};

const run = async () => {
  const arg = process.argv[2]; // "schema" or "seed"

  try {
    if (arg === 'schema') {
      await runFile(path.join(__dirname, 'schema.sql'));
    } else if (arg === 'seed') {
      await runFile(path.join(__dirname, 'seed.sql'));
    } else {
      console.log('Usage: node src/db/runSQL.js schema|seed');
    }
  } catch (err) {
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();