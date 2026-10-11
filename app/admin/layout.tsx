import { notFound } from 'next/navigation';
import { devToolsEnabled } from '@/lib/dev-tools';

// /admin/* holds local bootstrap tools (setup, seeding). The real admin console
// lives in the (admin) route group. Middleware already requires the admin role.
export default function AdminToolsLayout({ children }: { children: React.ReactNode }) {
  if (!devToolsEnabled()) notFound();
  return <>{children}</>;
}
