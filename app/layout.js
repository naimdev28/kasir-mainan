import './globals.css';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';

const display = Outfit({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'] });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata = { title: 'Kasir Mainan', description: 'Aplikasi kasir toko mainan' };

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
