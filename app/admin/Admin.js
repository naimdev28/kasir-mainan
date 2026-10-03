'use client';
import { useEffect, useState } from 'react';
import Foto from '@/components/Foto';
import Modal from '@/components/Modal';

const rp = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');

const tglIndo = (str) => {
  if (!str) return '-';
  const d = new Date(str);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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
  
  // Transaksi & Laporan
  const [transaksiData, setTransaksiData] = useState({ transactions: [], summary: {} });
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [loadingTrx, setLoadingTrx] = useState(false);
  const [expandedTrx, setExpandedTrx] = useState({});

  const [edit, setEdit] = useState(null); // null | {} (baru) | produk
  const [preview, setPreview] = useState(null);
  const [uForm, setUForm] = useState({ nama: '', username: '', password: '' });
  const [mForm, setMForm] = useState({ nama: '', telepon: '' });

  async function load() {
    try {
      const [pRes, uRes, mRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/users'),
        fetch('/api/members')
      ]);
      setProducts(await pRes.json());
      setUsers(await uRes.json());
      setMembers(await mRes.json());
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTransaksi(start = filterStartDate, end = filterEndDate) {
    setLoadingTrx(true);
    try {
      let url = '/api/transactions';
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      const queryString = params.toString();
      if (queryString) url += '?' + queryString;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTransaksiData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrx(false);
    }
  }

  useEffect(() => {
    load();
    loadTransaksi();
  }, []);

  const setFilterQuick = (type) => {
    const today = new Date();
    const formatYMD = (d) => d.toISOString().split('T')[0];

    if (type === 'today') {
      const t = formatYMD(today);
      setFilterStartDate(t);
      setFilterEndDate(t);
      loadTransaksi(t, t);
    } else if (type === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      const s = formatYMD(past);
      const e = formatYMD(today);
      setFilterStartDate(s);
      setFilterEndDate(e);
      loadTransaksi(s, e);
    } else if (type === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const s = formatYMD(start);
      const e = formatYMD(today);
      setFilterStartDate(s);
      setFilterEndDate(e);
      loadTransaksi(s, e);
    } else if (type === 'all') {
      setFilterStartDate('');
      setFilterEndDate('');
      loadTransaksi('', '');
    }
  };

  const toggleExpand = (id) => {
    setExpandedTrx((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const buka = (p) => {
    setEdit(p);
    setPreview(p.foto ? (p.foto.startsWith('data:') ? p.foto : `/api/foto/${p.foto}`) : null);
  };

  async function simpanBarang(e) {
    e.preventDefault();
    if (await kirim('/api/products', edit.id ? 'PUT' : 'POST', new FormData(e.target))) {
      setEdit(null);
      load();
    }
  }

  async function hapusBarang(p) {
    if (confirm(`Hapus "${p.nama}"?`) && (await kirim('/api/products', 'DELETE', { id: p.id }))) {
      load();
    }
  }

  async function tambahPetugas(e) {
    e.preventDefault();
    if (await kirim('/api/users', 'POST', uForm)) {
      setUForm({ nama: '', username: '', password: '' });
      load();
    }
  }

  async function tambahMember(e) {
    e.preventDefault();
    if (await kirim('/api/members', 'POST', mForm)) {
      setMForm({ nama: '', telepon: '' });
      load();
    }
  }

  const stat = [
    ['Jenis barang', products.length],
    ['Stok menipis', products.filter((p) => p.stok < 5).length],
    ['Total Omset', rp(transaksiData.summary?.totalOmset || 0)],
    ['Total Transaksi', transaksiData.summary?.totalTransaksi || 0]
  ];

  const tabs = [
    ['barang', 'Barang & stok'],
    ['riwayat', 'Riwayat penjualan'],
    ['petugas', 'Petugas'],
    ['member', 'Member']
  ];

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 sm:p-5">
      {/* Kartu Ringkasan (Responsive) */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
        {stat.map(([label, n]) => (
          <div key={label} className="panel p-3.5 sm:p-5">
            <div className="text-xs sm:text-sm text-ink/60 truncate">{label}</div>
            <div
              className={`font-display text-xl sm:text-2xl md:text-3xl font-bold truncate ${
                label === 'Stok menipis' && n > 0 ? 'text-signal' : 'text-brand-dark'
              }`}
            >
              {n}
            </div>
          </div>
        ))}
      </div>

      {/* Navigasi Tab (Scrollable di HP agar tidak meluap) */}
      <div className="mb-5 flex overflow-x-auto no-scrollbar gap-1 rounded-2xl bg-white p-1 shadow-card max-w-full">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition shrink-0 ${
              tab === k ? 'bg-brand text-white shadow-sm' : 'text-ink/70 hover:bg-brand-light'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB BARANG & STOK */}
      {tab === 'barang' && (
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between p-3.5 sm:p-5">
            <h2 className="text-base sm:text-xl font-bold text-brand-dark">Barang & stok</h2>
            <button className="btn btn-lime !px-3 !py-1.5 text-xs sm:text-sm" onClick={() => buka({})}>
              + Tambah barang
            </button>
          </div>
          {products.map((p) => (
            <div key={p.id} className="border-t border-ink/10 p-3 sm:px-5 sm:py-3.5">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl text-xs">
                  <Foto src={p.foto} nama={p.nama} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm sm:text-base font-semibold text-brand-dark">{p.nama}</div>
                  <div className="text-xs sm:text-sm tabular-nums text-ink/60">{rp(p.harga)}</div>
                  <div className="mt-1 sm:hidden">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        p.stok < 5 ? 'bg-signal/10 text-signal' : 'bg-lime-light text-lime-dark'
                      }`}
                    >
                      Stok {p.stok}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      p.stok < 5 ? 'bg-signal/10 text-signal' : 'bg-lime-light text-lime-dark'
                    }`}
                  >
                    Stok {p.stok}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button className="btn btn-ghost !px-2.5 !py-1 text-xs sm:!px-4 sm:!py-1.5 sm:text-sm" onClick={() => buka(p)}>
                    Ubah
                  </button>
                  <button className="btn btn-danger !px-2.5 !py-1 text-xs sm:!px-4 sm:!py-1.5 sm:text-sm" onClick={() => hapusBarang(p)}>
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <p className="border-t border-ink/10 p-6 text-sm text-ink/60">Belum ada barang. Klik “Tambah barang” untuk mulai.</p>
          )}
        </section>
      )}

      {/* TAB RIWAYAT PENJUALAN */}
      {tab === 'riwayat' && (
        <section className="space-y-4">
          {/* Panel Filter Tanggal */}
          <div className="panel p-3.5 sm:p-5">
            <h3 className="mb-3 text-base sm:text-lg font-bold text-brand-dark">Filter Riwayat Penjualan</h3>
            
            {/* Tombol Cepat */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button onClick={() => setFilterQuick('today')} className="btn btn-ghost !py-1 !px-2.5 text-xs">Hari ini</button>
              <button onClick={() => setFilterQuick('7days')} className="btn btn-ghost !py-1 !px-2.5 text-xs">7 Hari Terakhir</button>
              <button onClick={() => setFilterQuick('month')} className="btn btn-ghost !py-1 !px-2.5 text-xs">Bulan ini</button>
              <button onClick={() => setFilterQuick('all')} className="btn btn-ghost !py-1 !px-2.5 text-xs">Semua Waktu</button>
            </div>

            {/* Input Tanggal Manual */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
              <div>
                <label className="label text-xs">Dari Tanggal</label>
                <input
                  type="date"
                  className="field !py-1.5 text-xs sm:text-sm"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs">Sampai Tanggal</label>
                <input
                  type="date"
                  className="field !py-1.5 text-xs sm:text-sm"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadTransaksi(filterStartDate, filterEndDate)}
                  className="btn btn-primary flex-1 !py-2 text-xs sm:text-sm"
                >
                  Terapkan Filter
                </button>
                <button
                  type="button"
                  onClick={() => setFilterQuick('all')}
                  className="btn btn-ghost !py-2 text-xs sm:text-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Rincian Ringkasan Penjualan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="panel p-3.5 sm:p-4 bg-lime-light/40 border border-lime/30">
              <div className="text-xs text-ink/70">Total Omset</div>
              <div className="font-display text-lg sm:text-2xl font-bold text-lime-dark">
                {rp(transaksiData.summary?.totalOmset || 0)}
              </div>
            </div>
            <div className="panel p-3.5 sm:p-4">
              <div className="text-xs text-ink/70">Jumlah Transaksi</div>
              <div className="font-display text-lg sm:text-2xl font-bold text-brand-dark">
                {transaksiData.summary?.totalTransaksi || 0}
              </div>
            </div>
            <div className="panel p-3.5 sm:p-4">
              <div className="text-xs text-ink/70">Barang Terjual</div>
              <div className="font-display text-lg sm:text-2xl font-bold text-brand-dark">
                {transaksiData.summary?.totalBarang || 0} pcs
              </div>
            </div>
            <div className="panel p-3.5 sm:p-4">
              <div className="text-xs text-ink/70">Total Diskon</div>
              <div className="font-display text-lg sm:text-2xl font-bold text-signal">
                {rp(transaksiData.summary?.totalDiskon || 0)}
              </div>
            </div>
          </div>

          {/* Daftar Riwayat Transaksi */}
          <div className="panel overflow-hidden">
            <div className="p-3.5 sm:p-5 flex items-center justify-between border-b border-ink/10">
              <h3 className="font-bold text-brand-dark text-base sm:text-lg">Daftar Transaksi</h3>
              <span className="text-xs text-ink/60">{transaksiData.transactions?.length || 0} transaksi ditemukan</span>
            </div>

            {loadingTrx && <p className="p-6 text-center text-sm text-ink/60">Memuat data transaksi...</p>}

            {!loadingTrx && transaksiData.transactions?.length === 0 && (
              <p className="p-6 text-center text-sm text-ink/60">Belum ada riwayat transaksi pada rentang tanggal ini.</p>
            )}

            {!loadingTrx &&
              transaksiData.transactions?.map((t) => {
                const isOpen = !!expandedTrx[t.id];
                return (
                  <div key={t.id} className="border-b border-ink/10 p-3.5 sm:p-5 last:border-0 hover:bg-black/[0.01] transition">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs sm:text-sm font-bold text-brand">{t.kode}</span>
                          <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-brand">
                            {t.metode}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-ink/60">
                          {tglIndo(t.created_at)} · Kasir: <b className="text-ink/80">{t.kasir_nama}</b>
                          {t.member_nama && (
                            <span> · Member: <b className="text-lime-dark">{t.member_nama}</b></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 mt-1 sm:mt-0">
                        <div className="text-right">
                          <div className="font-display text-base sm:text-lg font-bold text-brand-dark tabular-nums">{rp(t.total)}</div>
                          {t.diskon > 0 && (
                            <div className="text-[11px] text-signal tabular-nums">Diskon {rp(t.diskon)}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(t.id)}
                          className="btn btn-ghost !px-2.5 !py-1 text-xs text-brand"
                        >
                          {isOpen ? 'Tutup ▲' : 'Detail ▼'}
                        </button>
                      </div>
                    </div>

                    {/* Rincian Barang yang Dibeli */}
                    {isOpen && (
                      <div className="mt-3.5 rounded-xl bg-ink/[0.03] p-3 text-xs">
                        <div className="font-semibold text-ink/70 mb-2">Barang yang dibeli:</div>
                        <div className="divide-y divide-ink/10">
                          {t.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between py-1.5">
                              <div>
                                <span className="font-medium text-brand-dark">{it.nama}</span>
                                <span className="text-ink/50 ml-1.5">({it.qty}x @ {rp(it.harga)})</span>
                              </div>
                              <div className="font-semibold tabular-nums">{rp(it.qty * it.harga)}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-ink/10 flex justify-between text-ink/60">
                          <span>Subtotal: {rp(t.subtotal)}</span>
                          <span>Dibayar: {rp(t.bayar)} · Kembalian: {rp(t.kembalian)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* TAB PETUGAS */}
      {tab === 'petugas' && (
        <section>
          <form onSubmit={tambahPetugas} className="panel mb-5 grid gap-3 p-3.5 sm:p-5 md:grid-cols-4 md:items-end">
            <div>
              <label className="label text-xs sm:text-sm">Nama lengkap</label>
              <input className="field text-sm" value={uForm.nama} onChange={(e) => setUForm({ ...uForm, nama: e.target.value })} required />
            </div>
            <div>
              <label className="label text-xs sm:text-sm">Username</label>
              <input className="field text-sm" value={uForm.username} onChange={(e) => setUForm({ ...uForm, username: e.target.value })} required />
            </div>
            <div>
              <label className="label text-xs sm:text-sm">Password</label>
              <input className="field text-sm" value={uForm.password} onChange={(e) => setUForm({ ...uForm, password: e.target.value })} required />
            </div>
            <button className="btn btn-primary w-full !py-2.5 text-xs sm:text-sm">Daftarkan petugas</button>
          </form>
          <div className="panel overflow-hidden">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between border-b border-ink/10 p-3.5 sm:px-5 sm:py-3.5 last:border-0">
                <div className="min-w-0 flex-1 pr-3">
                  <div className="font-semibold text-sm sm:text-base text-brand-dark truncate">{u.nama}</div>
                  <div className="text-xs text-ink/60 truncate">Username: {u.username} · Password: {u.password}</div>
                </div>
                <button
                  className="btn btn-danger !px-3 !py-1 text-xs shrink-0"
                  onClick={async () => confirm('Hapus petugas ini?') && (await kirim('/api/users', 'DELETE', { id: u.id })) && load()}
                >
                  Hapus
                </button>
              </div>
            ))}
            {users.length === 0 && <p className="p-6 text-sm text-ink/60">Belum ada petugas.</p>}
          </div>
        </section>
      )}

      {/* TAB MEMBER */}
      {tab === 'member' && (
        <section>
          <form onSubmit={tambahMember} className="panel mb-5 grid gap-3 p-3.5 sm:p-5 md:grid-cols-3 md:items-end">
            <div>
              <label className="label text-xs sm:text-sm">Nama pelanggan</label>
              <input className="field text-sm" value={mForm.nama} onChange={(e) => setMForm({ ...mForm, nama: e.target.value })} required />
            </div>
            <div>
              <label className="label text-xs sm:text-sm">No. telepon</label>
              <input className="field text-sm" value={mForm.telepon} onChange={(e) => setMForm({ ...mForm, telepon: e.target.value })} />
            </div>
            <button className="btn btn-primary w-full !py-2.5 text-xs sm:text-sm">Daftarkan member</button>
          </form>
          <div className="panel overflow-hidden">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-ink/10 p-3.5 sm:px-5 sm:py-3.5 last:border-0">
                <div className="min-w-0 flex-1 pr-3">
                  <div className="font-semibold text-sm sm:text-base text-brand-dark truncate">{m.nama}</div>
                  <div className="text-xs text-ink/60 truncate">{m.telepon || 'Tanpa nomor telepon'}</div>
                </div>
                <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand shrink-0">
                  {m.poin} poin
                </span>
              </div>
            ))}
            {members.length === 0 && (
              <p className="p-6 text-sm text-ink/60">Belum ada member. Kasir juga bisa mendaftarkan member langsung saat transaksi.</p>
            )}
          </div>
        </section>
      )}

      {/* MODAL TAMBAH/UBAH BARANG (Mobile Friendly: w-full max-w-md) */}
      {edit && (
        <Modal onClose={() => setEdit(null)}>
          <form onSubmit={simpanBarang} className="panel w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 sm:mb-5 text-lg sm:text-xl font-bold text-brand-dark">
              {edit.id ? 'Ubah barang' : 'Tambah barang'}
            </h3>
            {edit.id && <input type="hidden" name="id" value={edit.id} />}
            
            <div className="mb-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl">
                {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <Foto nama={edit.nama || '?'} />}
              </div>
              <div className="w-full">
                <label className="label text-xs sm:text-sm" htmlFor="foto">Foto barang</label>
                <input
                  id="foto"
                  name="foto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full text-xs sm:text-sm"
                  onChange={(e) => e.target.files[0] && setPreview(URL.createObjectURL(e.target.files[0]))}
                />
                <p className="mt-1 text-[11px] text-ink/50">JPG, PNG, atau WebP. Maks 2 MB.</p>
              </div>
            </div>

            <label className="label text-xs sm:text-sm" htmlFor="nama">Nama mainan</label>
            <input id="nama" name="nama" className="field mb-3 text-sm" defaultValue={edit.nama} required />

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs sm:text-sm" htmlFor="harga">Harga (Rp)</label>
                <input id="harga" name="harga" type="number" min="0" className="field text-sm" defaultValue={edit.harga} required />
              </div>
              <div>
                <label className="label text-xs sm:text-sm" htmlFor="stok">Stok</label>
                <input id="stok" name="stok" type="number" min="0" className="field text-sm" defaultValue={edit.stok} required />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1 !py-2 text-xs sm:text-sm" onClick={() => setEdit(null)}>
                Batal
              </button>
              <button className="btn btn-primary flex-1 !py-2 text-xs sm:text-sm">
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
