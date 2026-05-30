import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import AdminShell from './AdminShell';

export default async function AdminLayout({ children }) {
  const supabase = await createSupabaseServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, admin_role')
    .eq('id', session.user['id'])
    .single();

  if (!profile?.is_admin) redirect('/dashboard');

  return (
    <AdminShell adminRole={profile.admin_role || 'super_admin'}>
      {children}
    </AdminShell>
  );
}
