import { getSession } from '@/lib/auth';
import Topbar from '@/components/Topbar';
import Admin from './Admin';

export default async function AdminPage() {
  const s = await getSession();
  return (
    <>
      <Topbar nama={s.nama} role={s.role} />
      <Admin />
    </>
  );
}
