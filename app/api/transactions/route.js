import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (s.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate'); // format: YYYY-MM-DD
  const endDate = searchParams.get('endDate');     // format: YYYY-MM-DD
  const search = searchParams.get('search');

  let sql = `
    SELECT 
      t.id, t.kode, t.user_id, t.member_id, t.metode,
      t.subtotal, t.diskon, t.total, t.bayar, t.kembalian,
      t.created_at,
      u.nama AS kasir_nama,
      m.nama AS member_nama,
      m.telepon AS member_telepon
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN members m ON t.member_id = m.id
    WHERE 1=1
  `;
  const params = [];

  if (startDate) {
    sql += ' AND DATE(t.created_at) >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND DATE(t.created_at) <= ?';
    params.push(endDate);
  }
  if (search) {
    sql += ' AND (t.kode LIKE ? OR u.nama LIKE ? OR m.nama LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY t.created_at DESC';

  const [transactions] = await pool.query(sql, params);

  if (transactions.length > 0) {
    const ids = transactions.map((t) => t.id);
    const [items] = await pool.query(
      'SELECT transaction_id, product_id, nama, harga, qty FROM transaction_items WHERE transaction_id IN (?)',
      [ids]
    );

    const itemMap = {};
    for (const it of items) {
      if (!itemMap[it.transaction_id]) itemMap[it.transaction_id] = [];
      itemMap[it.transaction_id].push(it);
    }

    for (const t of transactions) {
      t.items = itemMap[t.id] || [];
    }
  }

  const totalOmset = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalDiskon = transactions.reduce((sum, t) => sum + (t.diskon || 0), 0);
  const totalBarang = transactions.reduce(
    (sum, t) => sum + (t.items ? t.items.reduce((s, it) => s + (it.qty || 0), 0) : 0),
    0
  );

  return NextResponse.json({
    transactions,
    summary: {
      totalTransaksi: transactions.length,
      totalOmset,
      totalDiskon,
      totalBarang
    }
  });
}
