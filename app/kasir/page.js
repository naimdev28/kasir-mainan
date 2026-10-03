import { getSession } from '@/lib/auth';
import Topbar from '@/components/Topbar';
import Kasir from './Kasir';

export default async function KasirPage() {
  const s = await getSession();
  return (
    <>
      <Topbar nama={s.nama} role={s.role} />
      <Kasir />
    </>
  );
}
