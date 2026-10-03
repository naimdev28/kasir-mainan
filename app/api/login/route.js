import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { createToken } from '@/lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];
  if (!user || user.password !== password)
    return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
  const res = NextResponse.json({ role: user.role });
  res.cookies.set('token', await createToken(user), { httpOnly: true, path: '/', maxAge: 60 * 60 * 8 });
  return res;
}
