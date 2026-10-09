import { notFound } from 'next/navigation';
import { devToolsEnabled } from '@/lib/dev-tools';

export default function DevToolsLayout({ children }: { children: React.ReactNode }) {
  if (!devToolsEnabled()) notFound();
  return <>{children}</>;
}
