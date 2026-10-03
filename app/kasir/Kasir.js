'use client';
import { useEffect, useMemo, useState } from 'react';
import Foto from '@/components/Foto';
import Modal from '@/components/Modal';

const rp = (n) => 'Rp' + Number(n).toLocaleString('id-ID');
const METODE = ['Tunai', 'QRIS', 'Transfer'];

export default function Kasir() {
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [cart, setCart] = useState([]);
  const [q, setQ] = useState('');
  const [member, setMember] = useState(null);
  const [memberQ, setMemberQ] = useState('');
  const [metode, setMetode] = useState('Tunai');
  const [bayar, setBayar] = useState('');
  const [error, setError] = useState('');
  const [struk, setStruk] = useState(null);
  const [showMember, setShowMember] = useState(false);
  const [newMember, setNewMember] = useState({ nama: '', telepon: '' });

  async function load() {
    setProducts(await (await fetch('/api/products')).json());
    setMembers(await (await fetch('/api/members')).json());
  }
  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) => p.nama.toLowerCase().includes(q.toLowerCase()));
  const hasilMember = memberQ.trim()
    ? members.filter((m) => `${m.nama} ${m.telepon || ''}`.toLowerCase().includes(memberQ.toLowerCase())).slice(0, 5)
    : [];

  const subtotal = useMemo(() => cart.reduce((a, c) => a + c.harga * c.qty, 0), [cart]);
  const diskon = member ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal - diskon;
  const bisaBayar = cart.length > 0 && (metode === 'Tunai' ? +bayar >= total : true);
  const jumlahItem = cart.reduce((a, c) => a + c.qty, 0);

  function tambah(p) {
    setCart((c) => {
      const ada = c.find((x) => x.id === p.id);
      if (ada) return c.map((x) => (x.id === p.id ? { ...x, qty: Math.min(x.qty + 1, p.stok) } : x));
      return [...c, { id: p.id, nama: p.nama, harga: p.harga, qty: 1, stok: p.stok, foto: p.foto }];
    });
  }
  const ubahQty = (id, d) =>
    setCart((c) => c.flatMap((x) => {
      if (x.id !== id) return [x];
      const qty = x.qty + d;
      return qty < 1 ? [] : [{ ...x, qty: Math.min(qty, x.stok) }];
    }));

  async function bayarSekarang() {
    setError('');
    const res = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items: cart.map(({ id, qty }) => ({ id, qty })), memberId: member?.id || null, metode, bayar })
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setStruk(data);
    setCart([]); setBayar(''); setMember(null); setMetode('Tunai');
    load();
  }

  async function daftarMember(e) {
    e.preventDefault();
    const res = await fetch('/api/members', { method: 'POST', body: JSON.stringify(newMember) });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    setMember({ id: data.id, nama: newMember.nama, telepon: newMember.telepon, poin: 0 });
    setNewMember({ nama: '', telepon: '' });
    setShowMember(false);
    load();
  }

  return (
    <main className="mx-auto grid max-w-[1500px] gap-6 p-5 lg:grid-cols-[1fr_420px]">
      {/* Katalog */}
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark">Pilih barang</h2>
            <p className="text-sm text-ink/60">{products.length} jenis mainan tersedia</p>
          </div>
          <input className="field max-w-xs" placeholder="Cari nama mainan" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {filtered.length === 0 && <p className="text-ink/60">Tidak ada mainan dengan nama itu.</p>}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const dikeranjang = cart.find((c) => c.id === p.id)?.qty || 0;
            return (
              <button key={p.id} disabled={p.stok < 1} onClick={() => tambah(p)}
                className="group overflow-hidden rounded-3xl bg-white text-left shadow-card transition active:scale-[0.98] disabled:opacity-60">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Foto src={p.foto} nama={p.nama} />
                  {dikeranjang > 0 && (
                    <span className="absolute left-3 top-3 flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-brand px-2 text-sm font-bold text-white ring-4 ring-white/80">{dikeranjang}</span>
                  )}
                  {p.stok < 1 && <span className="absolute inset-0 flex items-center justify-center bg-brand-dark/70 font-display text-xl font-bold text-white">Stok habis</span>}
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">{p.nama}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="font-display text-lg font-bold text-brand tabular-nums">{rp(p.harga)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.stok < 5 ? 'bg-signal/10 text-signal' : 'bg-lime-light text-lime-dark'}`}>Stok {p.stok}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Keranjang & pembayaran */}
      <aside className="panel flex flex-col overflow-hidden lg:sticky lg:top-[5.5rem] lg:h-[calc(100vh-7rem)]">
        <div className="border-b border-ink/10 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-dark">Pesanan</h2>
            <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand">{jumlahItem} item</span>
          </div>

          {member ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-lime-light p-3">
              <div>
                <div className="text-sm font-bold text-lime-dark">Member: {member.nama}</div>
                <div className="text-xs text-lime-dark/80">Diskon 5% untuk semua item · {member.poin} poin</div>
              </div>
              <button className="text-xs font-semibold text-lime-dark underline" onClick={() => setMember(null)}>Lepas</button>
            </div>
          ) : (
            <div className="relative mt-4">
              <div className="flex gap-2">
                <input className="field" placeholder="Cari member (nama / telepon)" value={memberQ} onChange={(e) => setMemberQ(e.target.value)} />
                <button className="btn btn-ghost shrink-0" onClick={() => setShowMember(true)}>+ Baru</button>
              </div>
              {memberQ.trim() && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-ink/10">
                  {hasilMember.map((m) => (
                    <button key={m.id} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-brand-light" onClick={() => { setMember(m); setMemberQ(''); }}>
                      <span className="font-semibold">{m.nama}</span> <span className="text-ink/50">{m.telepon}</span>
                    </button>
                  ))}
                  {hasilMember.length === 0 && (
                    <button className="block w-full px-4 py-3 text-left text-sm text-brand" onClick={() => { setNewMember({ nama: memberQ, telepon: '' }); setShowMember(true); setMemberQ(''); }}>
                      Tidak ditemukan. Daftarkan “{memberQ}” sebagai member baru
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-5">
          {cart.length === 0 && <p className="mt-6 text-center text-sm text-ink/50">Belum ada barang. Ketuk mainan di sebelah kiri.</p>}
          {cart.map((c) => (
            <div key={c.id} className="mb-4 flex gap-3 last:mb-0">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl text-[10px]"><Foto src={c.foto} nama={c.nama} /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{c.nama}</div>
                <div className="text-xs tabular-nums text-ink/60">
                  {member ? (<><s>{rp(c.harga)}</s> <b className="text-lime-dark">{rp(Math.round(c.harga * 0.95))}</b></>) : rp(c.harga)}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <button className="h-6 w-6 rounded-lg bg-brand-light font-bold text-brand" onClick={() => ubahQty(c.id, -1)} aria-label="Kurangi">−</button>
                  <span className="w-5 text-center text-sm font-bold tabular-nums">{c.qty}</span>
                  <button className="h-6 w-6 rounded-lg bg-brand-light font-bold text-brand disabled:opacity-40" disabled={c.qty >= c.stok} onClick={() => ubahQty(c.id, 1)} aria-label="Tambah">+</button>
                </div>
              </div>
              <div className="text-sm font-bold tabular-nums">{rp(c.harga * c.qty)}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-ink/10 bg-page/60 p-5">
          <dl className="space-y-1 text-sm tabular-nums">
            <div className="flex justify-between"><dt className="text-ink/60">Subtotal</dt><dd>{rp(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Diskon member 5%</dt><dd className={diskon ? 'font-semibold text-lime-dark' : ''}>{diskon ? '−' + rp(diskon) : rp(0)}</dd></div>
            <div className="flex items-baseline justify-between pt-1"><dt className="font-semibold">Total bayar</dt><dd className="font-display text-2xl font-bold text-brand-dark">{rp(total)}</dd></div>
          </dl>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white p-1 ring-1 ring-ink/10">
            {METODE.map((m) => (
              <button key={m} onClick={() => setMetode(m)} className={`rounded-lg py-2 text-sm font-semibold transition ${metode === m ? 'bg-brand text-white' : 'text-ink/70 hover:bg-brand-light'}`}>{m}</button>
            ))}
          </div>

          {metode === 'Tunai' ? (
            <>
              <input type="number" className="field mt-3 tabular-nums" placeholder="Uang diterima" value={bayar} onChange={(e) => setBayar(e.target.value)} />
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" disabled={!total} onClick={() => setBayar(String(total))}>Uang pas</button>
                {[50000, 100000, 200000].map((n) => (
                  <button key={n} className="btn btn-ghost !px-3 !py-1.5 !text-xs" disabled={n < total} onClick={() => setBayar(String(n))}>{n / 1000}rb</button>
                ))}
              </div>
              {bayar && total > 0 && +bayar >= total && (
                <p className="mt-3 flex justify-between text-sm font-semibold tabular-nums"><span>Kembalian</span><span className="text-lime-dark">{rp(+bayar - total)}</span></p>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-ink/60">Pastikan pembayaran {metode} sebesar {rp(total)} sudah masuk sebelum menekan tombol bayar.</p>
          )}

          {error && <p className="mt-3 rounded-xl bg-signal/10 px-3 py-2 text-sm font-medium text-signal">{error}</p>}
          <button className="btn btn-lime mt-4 w-full !py-3.5 text-base" disabled={!bisaBayar} onClick={bayarSekarang}>Bayar {cart.length ? rp(total) : ''}</button>
        </div>
      </aside>

      {showMember && (
        <Modal onClose={() => setShowMember(false)}>
          <form onSubmit={daftarMember} className="panel w-[24rem] p-6">
            <h3 className="text-xl font-bold text-brand-dark">Daftarkan member baru</h3>
            <p className="mb-5 mt-1 text-sm text-ink/60">Member otomatis dapat diskon 5% di semua item dan mengumpulkan poin.</p>
            <label className="label" htmlFor="mn">Nama pelanggan</label>
            <input id="mn" className="field mb-3" value={newMember.nama} onChange={(e) => setNewMember({ ...newMember, nama: e.target.value })} required autoFocus />
            <label className="label" htmlFor="mt">No. telepon</label>
            <input id="mt" className="field mb-6" value={newMember.telepon} onChange={(e) => setNewMember({ ...newMember, telepon: e.target.value })} />
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowMember(false)}>Batal</button>
              <button className="btn btn-primary flex-1">Simpan & pakai</button>
            </div>
          </form>
        </Modal>
      )}

      {struk && (
        <Modal onClose={() => setStruk(null)}>
          <div className="panel p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-lg font-bold text-brand-dark">✓</span>
              <div><div className="font-display text-lg font-bold text-brand-dark">Pembayaran berhasil</div><div className="text-xs text-ink/60">{struk.metode}</div></div>
            </div>
            <div id="struk" className="w-72 rounded-xl bg-page p-4 font-mono text-xs leading-relaxed">
              <h3 className="text-center font-display text-base font-bold">Kasir Mainan</h3>
              <hr className="my-2 border-dashed border-ink/40" />
              <p>{struk.kode}</p>
              <p>{new Date(struk.tanggal).toLocaleString('id-ID')}</p>
              <p>Kasir: {struk.kasir}</p>
              {struk.member && <p>Member: {struk.member}</p>}
              <hr className="my-2 border-dashed border-ink/40" />
              {struk.items.map((i, k) => (
                <div key={k} className="mb-1">
                  <div>{i.nama}</div>
                  <div className="flex justify-between"><span>{i.qty} x {rp(i.harga)}</span><span>{rp(i.qty * i.harga)}</span></div>
                </div>
              ))}
              <hr className="my-2 border-dashed border-ink/40" />
              <div className="flex justify-between"><span>Subtotal</span><span>{rp(struk.subtotal)}</span></div>
              <div className="flex justify-between"><span>Diskon member</span><span>-{rp(struk.diskon)}</span></div>
              <div className="flex justify-between text-sm font-bold"><span>Total</span><span>{rp(struk.total)}</span></div>
              <div className="flex justify-between"><span>Bayar ({struk.metode})</span><span>{rp(struk.bayar)}</span></div>
              <div className="flex justify-between"><span>Kembali</span><span>{rp(struk.kembalian)}</span></div>
              <hr className="my-2 border-dashed border-ink/40" />
              <p className="text-center">Terima kasih, selamat bermain!</p>
            </div>
            <div className="mt-5 flex gap-2">
              <button className="btn btn-primary flex-1" onClick={() => window.print()}>Cetak struk</button>
              <button className="btn btn-ghost flex-1" onClick={() => setStruk(null)}>Selesai</button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
