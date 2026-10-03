'use client';
import { useEffect, useState } from 'react';
import Foto from '@/components/Foto';
import Modal from '@/components/Modal';

const rp = (n) => 'Rp' + Number(n).toLocaleString('id-ID');

async function kirim(url, method, body) {
  const form = body instanceof FormData;
  const res = await fetch(url, { method, body: form ? body : JSON.stringify(body) });
  const d = await res.json();
  if (!res.ok) alert(d.error);
  return res.ok;
}

export default function Admin() {
  const [tab, setTab] = useState('barang');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [edit, setEdit] = useState(null); // null | {} (baru) | produk
  const [preview, setPreview] = useState(null);
  const [uForm, setUForm] = useState({ nama: '', username: '', password: '' });
  const [mForm, setMForm] = useState({ nama: '', telepon: '' });

  async function load() {
    setProducts(await (await fetch('/api/products')).json());
    setUsers(await (await fetch('/api/users')).json());
    setMembers(await (await fetch('/api/members')).json());
  }
  useEffect(() => { load(); }, []);

  const buka = (p) => { setEdit(p); setPreview(p.foto ? `/api/foto/${p.foto}` : null); };

  async function simpanBarang(e) {
    e.preventDefault();
    if (await kirim('/api/products', edit.id ? 'PUT' : 'POST', new FormData(e.target))) { setEdit(null); load(); }
  }
  async function hapusBarang(p) {
    if (confirm(`Hapus "${p.nama}"?`) && (await kirim('/api/products', 'DELETE', { id: p.id }))) load();
  }
  async function tambahPetugas(e) {
    e.preventDefault();
    if (await kirim('/api/users', 'POST', uForm)) { setUForm({ nama: '', username: '', password: '' }); load(); }
  }
  async function tambahMember(e) {
    e.preventDefault();
    if (await kirim('/api/members', 'POST', mForm)) { setMForm({ nama: '', telepon: '' }); load(); }
  }

  const stat = [
    ['Jenis barang', products.length],
    ['Stok menipis', products.filter((p) => p.stok < 5).length],
    ['Petugas', users.length],
    ['Member', members.length]
  ];
  const tabs = [['barang', 'Barang & stok'], ['petugas', 'Petugas'], ['member', 'Member']];

  return (
    <main className="mx-auto max-w-6xl p-5">
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stat.map(([label, n]) => (
          <div key={label} className="panel p-5">
            <div className="text-sm text-ink/60">{label}</div>
            <div className={`font-display text-3xl font-bold ${label === 'Stok menipis' && n > 0 ? 'text-signal' : 'text-brand-dark'}`}>{n}</div>
          </div>
        ))}
      </div>

      <div className="mb-5 inline-flex gap-1 rounded-2xl bg-white p-1 shadow-card">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${tab === k ? 'bg-brand text-white' : 'text-ink/70 hover:bg-brand-light'}`}>{label}</button>
        ))}
      </div>

      {tab === 'barang' && (
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h2 className="text-xl font-bold text-brand-dark">Barang & stok</h2>
            <button className="btn btn-lime" onClick={() => buka({})}>+ Tambah barang</button>
          </div>
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 border-t border-ink/10 px-5 py-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl text-xs"><Foto src={p.foto} nama={p.nama} /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{p.nama}</div>
                <div className="text-sm tabular-nums text-ink/60">{rp(p.harga)}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.stok < 5 ? 'bg-signal/10 text-signal' : 'bg-lime-light text-lime-dark'}`}>Stok {p.stok}</span>
              <button className="btn btn-ghost !py-1.5" onClick={() => buka(p)}>Ubah</button>
              <button className="btn btn-danger !py-1.5" onClick={() => hapusBarang(p)}>Hapus</button>
            </div>
          ))}
          {products.length === 0 && <p className="border-t border-ink/10 p-6 text-ink/60">Belum ada barang. Klik “Tambah barang” untuk mulai.</p>}
        </section>
      )}

      {tab === 'petugas' && (
        <section>
          <form onSubmit={tambahPetugas} className="panel mb-5 grid gap-3 p-5 md:grid-cols-4 md:items-end">
            <div><label className="label">Nama lengkap</label><input className="field" value={uForm.nama} onChange={(e) => setUForm({ ...uForm, nama: e.target.value })} required /></div>
            <div><label className="label">Username</label><input className="field" value={uForm.username} onChange={(e) => setUForm({ ...uForm, username: e.target.value })} required /></div>
            <div><label className="label">Password</label><input className="field" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} required /></div>
            <button className="btn btn-primary">Daftarkan petugas</button>
          </form>
          <div className="panel overflow-hidden">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between border-b border-ink/10 px-5 py-3 last:border-0">
                <div><div className="font-semibold">{u.nama}</div><div className="text-sm text-ink/60">Username: {u.username} · Password: {u.password}</div></div>
                <button className="btn btn-danger !py-1.5" onClick={async () => confirm('Hapus petugas ini?') && (await kirim('/api/users', 'DELETE', { id: u.id })) && load()}>Hapus</button>
              </div>
            ))}
            {users.length === 0 && <p className="p-6 text-ink/60">Belum ada petugas.</p>}
          </div>
        </section>
      )}

      {tab === 'member' && (
        <section>
          <form onSubmit={tambahMember} className="panel mb-5 grid gap-3 p-5 md:grid-cols-3 md:items-end">
            <div><label className="label">Nama pelanggan</label><input className="field" value={mForm.nama} onChange={(e) => setMForm({ ...mForm, nama: e.target.value })} required /></div>
            <div><label className="label">No. telepon</label><input className="field" value={mForm.telepon} onChange={(e) => setMForm({ ...mForm, telepon: e.target.value })} /></div>
            <button className="btn btn-primary">Daftarkan member</button>
          </form>
          <div className="panel overflow-hidden">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-ink/10 px-5 py-3 last:border-0">
                <div><div className="font-semibold">{m.nama}</div><div className="text-sm text-ink/60">{m.telepon || 'Tanpa nomor telepon'}</div></div>
                <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand">{m.poin} poin</span>
              </div>
            ))}
            {members.length === 0 && <p className="p-6 text-ink/60">Belum ada member. Kasir juga bisa mendaftarkan member langsung saat transaksi.</p>}
          </div>
        </section>
      )}

      {edit && (
        <Modal onClose={() => setEdit(null)}>
          <form onSubmit={simpanBarang} className="panel w-[26rem] p-6">
            <h3 className="mb-5 text-xl font-bold text-brand-dark">{edit.id ? 'Ubah barang' : 'Tambah barang'}</h3>
            {edit.id && <input type="hidden" name="id" value={edit.id} />}
            <div className="mb-5 flex items-center gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
                {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <Foto nama={edit.nama || '?'} />}
              </div>
              <div>
                <label className="label" htmlFor="foto">Foto barang</label>
                <input id="foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-sm"
                  onChange={(e) => e.target.files[0] && setPreview(URL.createObjectURL(e.target.files[0]))} />
                <p className="mt-1 text-xs text-ink/50">JPG, PNG, atau WebP. Maks 3 MB.</p>
              </div>
            </div>
            <label className="label" htmlFor="nama">Nama mainan</label>
            <input id="nama" name="nama" className="field mb-3" defaultValue={edit.nama} required />
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="harga">Harga (Rp)</label><input id="harga" name="harga" type="number" min="0" className="field" defaultValue={edit.harga} required /></div>
              <div><label className="label" htmlFor="stok">Stok</label><input id="stok" name="stok" type="number" min="0" className="field" defaultValue={edit.stok} required /></div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setEdit(null)}>Batal</button>
              <button className="btn btn-primary flex-1">Simpan</button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
