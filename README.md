# Kasir Mainan (Next.js + MySQL Laragon)

1. Start All di Laragon, lalu di Terminal Laragon (dari folder ini):
   mysql -u root < database\schema.sql
2. Cek .env.local (DB_USER / DB_PASSWORD, database: kasir_mainan)
3. npm install
4. npm run dev  ->  http://localhost:3000

Akun awal:  admin / admin123   dan   kasir1 / kasir123
Password disimpan polos (tanpa hash) di tabel `users`, bisa dilihat di HeidiSQL.
Foto barang disimpan di folder `uploads/`.
