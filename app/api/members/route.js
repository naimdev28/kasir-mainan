import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [rows] = await pool.query('SELECT * FROM members ORDER BY nama');
  return NextResponse.json(rows);
}

export async function POST(req) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { nama, telepon } = await req.json();
  try {
    const [r] = await pool.query('INSERT INTO members (nama, telepon) VALUES (?,?)', [nama.trim(), telepon?.trim() || null]);
    return NextResponse.json({ ok: true, id: r.insertId });
  } catch {
    return NextResponse.json({ error: 'Nomor telepon sudah terdaftar sebagai member' }, { status: 400 });
  }
}
