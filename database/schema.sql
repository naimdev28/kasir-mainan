-- Jalankan baris ini HANYA jika di lokal dan database belum ada:
-- CREATE DATABASE IF NOT EXISTS kasir_mainan;
-- USE kasir_mainan;

-- Password disimpan apa adanya (tanpa hash) supaya bisa dilihat langsung di HeidiSQL / phpMyAdmin / Railway Data.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role ENUM('admin','petugas') NOT NULL DEFAULT 'petugas',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  telepon VARCHAR(20) UNIQUE,
  poin INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  harga INT NOT NULL,
  stok INT NOT NULL DEFAULT 0,
  foto VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  member_id INT NULL,
  metode VARCHAR(20) NOT NULL DEFAULT 'Tunai',
  subtotal INT NOT NULL,
  diskon INT NOT NULL DEFAULT 0,
  total INT NOT NULL,
  bayar INT NOT NULL,
  kembalian INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  product_id INT NOT NULL,
  nama VARCHAR(150) NOT NULL,
  harga INT NOT NULL,
  qty INT NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT IGNORE INTO users (nama, username, password, role) VALUES
('Administrator', 'admin', 'admin123', 'admin'),
('Kasir Satu', 'kasir1', 'kasir123', 'petugas');

INSERT IGNORE INTO products (id, nama, harga, stok) VALUES
(1, 'Buzz Lightyear Action Figure', 250000, 15),
(2, 'Woody Sheriff Doll', 230000, 12),
(3, 'Mobil Remote Control', 180000, 20),
(4, 'Puzzle 100 Pcs', 60000, 30),
(5, 'LEGO Space Set', 450000, 8);
