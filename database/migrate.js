const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Baca .env.local jika ada
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

async function runMigration() {
  console.log('--- Menjalankan Migrasi Database ---');

  let connectionConfig;
  if (process.env.DATABASE_URL) {
    console.log('Menggunakan DATABASE_URL...');
    connectionConfig = {
      uri: process.env.DATABASE_URL,
      multipleStatements: true,
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
    };
  } else {
    console.log(`Menggunakan host: ${process.env.DB_HOST || 'localhost'}, db: ${process.env.DB_NAME || 'kasir_mainan'}`);
    connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kasir_mainan',
      multipleStatements: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    };
  }

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✓ Berhasil terhubung ke database!');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Menjalankan schema.sql...');
    await connection.query(sql);
    console.log('✓ Semua tabel dan data awal berhasil dibuat di database!');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Gagal menjalankan migrasi:', error.message || error.code || error);
    if (error.code === 'ECONNREFUSED') {
      console.error('  -> Koneksi ditolak. Pastikan database MySQL aktif dan port/host sudah benar.');
    }
    process.exit(1);
  }
}

runMigration();
