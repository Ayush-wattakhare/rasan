import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, Search, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import UserManagementActions from '@/components/admin/user-management-actions';
import CreateUserButtons from '@/components/admin/create-user-buttons';
import { UserRole } from '@/types';

export const metadata = {
  title: 'User Management | Rasan Admin',
  description: 'Manage all users, roles, and account statuses',
};

export default async function UserManagementPage(props: {
  searchParams: Promise<{ role?: string; search?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { role, search, page: pageStr } = await props.searchParams;
  const page = parseInt(pageStr || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (role && role !== 'all') {
    query = query.eq('role', role as UserRole);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count || 0) / limit);

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    vendor: 'bg-orange-100 text-orange-700',
    delivery: 'bg-blue-100 text-blue-700',
    customer: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-12 px-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="container mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Shield className="w-4 h-4 text-orange-500" />
              <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">ADMIN ACCESS</span>
            </div>
            <div>
              <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
                USER <span className="text-orange-600">REGISTRY</span>
              </h1>
              <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[0.65rem] flex items-center gap-2 mt-2">
                <Users className="w-3.5 h-3.5" /> {count || 0} REGISTERED ACCOUNTS
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Create Actions */}
            <CreateUserButtons />

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'customer', 'vendor', 'delivery', 'admin'].map((r) => (
                <Link
                  key={r}
                  href={`/user-management?role=${r}`}
                  className={`px-3 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-widest transition-all ${
                    (role || 'all') === r
                      ? 'bg-orange-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {r}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-8 -mt-6 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
          {/* Search */}
          <div className="p-6 border-b border-gray-100">
            <form>
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search by name or email…"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                {role && <input type="hidden" name="role" value={role} />}
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[0.55rem] font-black text-gray-400 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(users || []).map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-black text-gray-600">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{user.name || '—'}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {user.is_active ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /><span className="text-xs font-bold text-green-600">Active</span></>
                        ) : (
                          <><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-xs font-bold text-red-500">Inactive</span></>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <UserManagementActions userId={user.id} isActive={user.is_active} currentRole={user.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 flex items-center justify-between border-t border-gray-100">
              <p className="text-xs text-gray-400 font-bold">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/user-management?role=${role || 'all'}&page=${page - 1}`} className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-black text-gray-600 hover:bg-gray-100 transition">
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/user-management?role=${role || 'all'}&page=${page + 1}`} className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-black hover:bg-orange-500 transition">
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
