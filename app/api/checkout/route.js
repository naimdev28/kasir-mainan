import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

const DISKON_MEMBER = 0.05; // 5% untuk semua item bila pembeli member
const POIN_PER = 10000;     // 1 poin tiap belanja Rp10.000
const METODE = ['Tunai', 'QRIS', 'Transfer'];

export async function POST(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { items, memberId, bayar, metode } = await req.json();
  if (!items?.length) return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
  if (!METODE.includes(metode)) return NextResponse.json({ error: 'Metode pembayaran tidak valid' }, { status: 400 });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let subtotal = 0;
    const lines = [];
    for (const it of items) {
      const [[p]] = await conn.query('SELECT * FROM products WHERE id=? FOR UPDATE', [it.id]);
      if (!p || p.stok < it.qty) throw new Error(`Stok ${p?.nama || 'barang'} tidak cukup`);
      subtotal += p.harga * it.qty;
      lines.push({ ...p, qty: it.qty });
    }
    const diskon = memberId ? Math.round(subtotal * DISKON_MEMBER) : 0;
    const total = subtotal - diskon;
    const dibayar = metode === 'Tunai' ? +bayar : total;
    if (dibayar < total) throw new Error('Uang yang diterima kurang dari total');
    const kode = 'TRX' + Date.now();
    const [r] = await conn.query(
      'INSERT INTO transactions (kode,user_id,member_id,metode,subtotal,diskon,total,bayar,kembalian) VALUES (?,?,?,?,?,?,?,?,?)',
      [kode, s.id, memberId || null, metode, subtotal, diskon, total, dibayar, dibayar - total]);
    for (const l of lines) {
      await conn.query('INSERT INTO transaction_items (transaction_id,product_id,nama,harga,qty) VALUES (?,?,?,?,?)', [r.insertId, l.id, l.nama, l.harga, l.qty]);
      await conn.query('UPDATE products SET stok = stok - ? WHERE id=?', [l.qty, l.id]);
    }
    let member = null;
    if (memberId) {
      await conn.query('UPDATE members SET poin = poin + ? WHERE id=?', [Math.floor(total / POIN_PER), memberId]);
      [[member]] = await conn.query('SELECT nama FROM members WHERE id=?', [memberId]);
    }
    await conn.commit();
    return NextResponse.json({
      kode, kasir: s.nama, member: member?.nama || null, metode, tanggal: new Date().toISOString(),
      items: lines.map(({ nama, harga, qty }) => ({ nama, harga, qty })),
      subtotal, diskon, total, bayar: dibayar, kembalian: dibayar - total
    });
  } catch (e) {
    await conn.rollback();
    return NextResponse.json({ error: e.message }, { status: 400 });
  } finally {
    conn.release();
  }
}
