'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Topbar';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    router.push(data.role === 'admin' ? '/admin' : '/kasir');
    router.refresh();
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand-dark p-12 lg:flex lg:flex-col">
        <Logo />
        <div className="relative z-10 mt-auto max-w-md">
          <h1 className="text-5xl font-bold leading-tight text-white">Layani pembeli lebih cepat, dari pilih mainan sampai struk.</h1>
        </div>
        {/* motif sayap & strip lengan Buzz */}
        <div className="absolute -right-24 top-24 h-48 w-[28rem] -rotate-[28deg] bg-brand" />
        <div className="absolute -right-10 top-48 h-6 w-[26rem] -rotate-[28deg] bg-lime" />
        <div className="absolute -right-16 top-64 h-6 w-[22rem] -rotate-[28deg] bg-visor" />
        <div className="absolute right-24 top-80 h-4 w-[14rem] -rotate-[28deg] bg-signal" />
      </section>

      <section className="flex items-center justify-center bg-white p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-10 lg:hidden"><Logo dark /></div>
          <h2 className="text-3xl font-bold text-brand-dark">Masuk</h2>
          <p className="mb-7 mt-1 text-sm text-ink/60">Gunakan akun yang diberikan admin.</p>
          {error && <p className="mb-4 rounded-xl bg-signal/10 px-4 py-3 text-sm font-medium text-signal">{error}</p>}
          <label className="label" htmlFor="u">Username</label>
          <input id="u" className="field mb-4" value={form.username} autoFocus onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <label className="label" htmlFor="p">Password</label>
          <input id="p" type="password" className="field mb-6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button className="btn btn-primary w-full !py-3">Masuk</button>
        </form>
      </section>
    </main>
  );
}
