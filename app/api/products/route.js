import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { saveFoto, hapusFoto } from '@/lib/upload';

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 });

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [rows] = await pool.query('SELECT * FROM products ORDER BY nama');
  return NextResponse.json(rows);
}

export async function POST(req) {
  const s = await getSession();
  if (s?.role !== 'admin') return forbidden();
  try {
    const fd = await req.formData();
    const foto = await saveFoto(fd.get('foto'));
    await pool.query('INSERT INTO products (nama, harga, stok, foto) VALUES (?,?,?,?)',
      [fd.get('nama'), +fd.get('harga'), +fd.get('stok'), foto]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(req) {
  const s = await getSession();
  if (s?.role !== 'admin') return forbidden();
  try {
    const fd = await req.formData();
    const id = fd.get('id');
    const [[lama]] = await pool.query('SELECT foto FROM products WHERE id=?', [id]);
    const baru = await saveFoto(fd.get('foto'));
    await pool.query('UPDATE products SET nama=?, harga=?, stok=?, foto=? WHERE id=?',
      [fd.get('nama'), +fd.get('harga'), +fd.get('stok'), baru || lama?.foto || null, id]);
    if (baru) await hapusFoto(lama?.foto);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  const s = await getSession();
  if (s?.role !== 'admin') return forbidden();
  const { id } = await req.json();
  const [[p]] = await pool.query('SELECT foto FROM products WHERE id=?', [id]);
  try {
    await pool.query('DELETE FROM products WHERE id=?', [id]);
  } catch {
    return NextResponse.json({ error: 'Barang ini sudah pernah terjual, jadi tidak bisa dihapus. Set stoknya ke 0 saja.' }, { status: 400 });
  }
  await hapusFoto(p?.foto);
  return NextResponse.json({ ok: true });
}
