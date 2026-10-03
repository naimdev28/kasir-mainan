const WARNA = ['bg-brand', 'bg-visor', 'bg-lime-dark', 'bg-brand-mid', 'bg-signal'];

export default function Foto({ src, nama = '', className = '' }) {
  if (src) return <img src={`/api/foto/${src}`} alt={nama} className={`h-full w-full object-cover ${className}`} />;
  const i = [...nama].reduce((a, c) => a + c.charCodeAt(0), 0) % WARNA.length;
  return (
    <div className={`flex h-full w-full items-center justify-center font-display font-bold text-white/85 ${WARNA[i]} ${className}`}>
      <span className="text-[2.4em] leading-none">{nama.trim().charAt(0).toUpperCase() || '?'}</span>
    </div>
  );
}
