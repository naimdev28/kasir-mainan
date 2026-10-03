import fs from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR } from '@/lib/upload';

const TYPES = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

export async function GET(_req, { params }) {
  const name = path.basename(params.name);
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type) return new Response('Not found', { status: 404 });
  try {
    const buf = await fs.readFile(path.join(UPLOAD_DIR, name));
    return new Response(buf, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
