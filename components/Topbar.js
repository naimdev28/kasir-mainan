'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Logo({ dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white">
        <div className="absolute inset-x-0 top-0 h-3 bg-lime" />
        <div className="absolute bottom-1.5 left-1.5 h-2 w-2 rounded-full bg-visor" />
        <div className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-signal" />
      </div>
      <span className={`font-display text-xl font-bold tracking-tight ${dark ? 'text-brand-dark' : 'text-white'}`}>Kasir Mainan</span>
    </div>
  );
}

export default function Topbar({ nama, role, link }) {
  const router = useRouter();
  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-brand-dark px-6 py-3.5">
      <Logo />
      <div className="flex items-center gap-3">
        {link && <Link href={link.href} className="btn btn-lime !py-2">{link.label}</Link>}
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-sm font-semibold text-white">{nama}</div>
          <div className="text-xs text-white/60">{role === 'admin' ? 'Admin' : 'Kasir'}</div>
        </div>
        <button onClick={logout} className="btn !py-2 bg-white/10 text-white hover:bg-white/20">Keluar</button>
      </div>
    </header>
  );
}
