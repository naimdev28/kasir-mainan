import mysql from 'mysql2/promise';

const globalForDb = globalThis;
function createPool() {
  if (process.env.DATABASE_URL) {
    return mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
    });
  }

  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kasir_mainan',
    waitForConnections: true,
    connectionLimit: 10,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
}

export const pool = globalForDb._pool || createPool();
if (process.env.NODE_ENV !== 'production') globalForDb._pool = pool;
