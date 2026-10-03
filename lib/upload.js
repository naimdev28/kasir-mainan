import path from 'path';

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export async function saveFoto(file) {
  if (!file || typeof file === 'string' || !file.size) return null;
  const ext = EXT[file.type];
  if (!ext) throw new Error('Foto harus berformat JPG, PNG, atau WebP');
  if (file.size > 2 * 1024 * 1024) throw new Error('Ukuran foto maksimal 2 MB');

  // Simpan foto sebagai Base64 Data URL agar bekerja sempurna di Vercel (serverless/read-only)
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString('base64')}`;
}

export async function hapusFoto(_name) {
  // Tidak perlu hapus file fisik karena foto tersimpan langsung di database cloud
}
