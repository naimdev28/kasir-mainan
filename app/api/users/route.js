import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 });

export async function GET() {
  const s = await getSession();
  if (s?.role !== 'admin') return forbidden();
  const [rows] = await pool.query("SELECT id, nama, username, password FROM users WHERE role='petugas' ORDER BY id DESC");
  return NextResponse.json(rows);
}

export async function POST(req) {
  const s = await getSession();
  if (s?.role !== 'admin') return forbidden();
  const { nama, username, password } = await req.json();
  try {
    await pool.query('INSERT INTO users (nama, username, password, role) VALUES (?,?,?,?)', [nama, username, password, 'petugas']);
  } catch {
    return NextResponse.json({ error: 'Username sudah dipakai' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const s = await getSession();
  if (s?.role !== 'admin') return forbidden();
  const { id } = await req.json();
  try {
    await pool.query("DELETE FROM users WHERE id=? AND role='petugas'", [id]);
  } catch {
    return NextResponse.json({ error: 'Petugas ini sudah punya transaksi, jadi tidak bisa dihapus' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
