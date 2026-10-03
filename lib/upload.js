import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export async function saveFoto(file) {
  if (!file || typeof file === 'string' || !file.size) return null;
  const ext = EXT[file.type];
  if (!ext) throw new Error('Foto harus berformat JPG, PNG, atau WebP');
  if (file.size > 3 * 1024 * 1024) throw new Error('Ukuran foto maksimal 3 MB');
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = crypto.randomBytes(8).toString('hex') + ext;
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return name;
}

export async function hapusFoto(name) {
  if (!name) return;
  try { await fs.unlink(path.join(UPLOAD_DIR, path.basename(name))); } catch {}
}
