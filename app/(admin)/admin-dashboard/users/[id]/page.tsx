import { createClient, createServiceClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import {
  ShieldCheck,
  User,
  MapPin,
  Phone,
  Mail,
  Clock,
  FileText,
  Banknote,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VerificationActions from '@/components/admin/verification-actions';

export default async function UserDossierPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  // Verify admin auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin') redirect('/');

  // Fetch target user data
  const { data: targetProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (profileError || !targetProfile) notFound();

  // Fetch role specific data. Bank details and documents are server-only
  // columns, so read them with the service role (caller verified as admin above).
  const serviceClient = createServiceClient();
  let roleData: any = null;
  if (targetProfile.role === 'vendor') {
    const { data } = await serviceClient
      .from('vendors')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();
    roleData = data;
  } else if (targetProfile.role === 'delivery') {
    const { data } = await serviceClient
      .from('delivery_partners')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();
    roleData = data;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* ── TACTICAL HEADER ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] px-8 py-16">
        <div className="absolute top-0 right-0 -mt-32 -mr-32 h-80 w-80 rounded-full bg-orange-600/10 blur-[100px]"></div>
        <div className="relative z-10 container mx-auto">
          <Link
            href="/admin-dashboard/users"
            className="mb-8 inline-flex items-center gap-2 text-[0.6rem] font-black tracking-widest text-gray-500 uppercase transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Nexus Population
          </Link>
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-xl">
                <ShieldCheck className="h-4 w-4 text-orange-500" />
                <span className="text-[0.6rem] font-black tracking-[0.3em] text-white uppercase italic">
                  Personnel Dossier: {id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-6xl leading-none font-black tracking-tighter text-white uppercase italic">
                {targetProfile.name}
              </h1>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <VerificationActions
                userId={targetProfile.id}
                isVerified={targetProfile.is_verified}
                isActive={targetProfile.is_active}
                role={targetProfile.role}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 container mx-auto -mt-10 px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Left Column: Profile Card */}
          <div className="space-y-8">
            <div className="space-y-8 rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-3xl font-black text-orange-600 italic">
                  {targetProfile.name.charAt(0)}
                </div>
                <Badge
                  className={`${targetProfile.is_verified ? 'bg-green-600' : 'bg-orange-600'} h-8 rounded-full px-4 text-[0.6rem] font-black tracking-widest text-white uppercase`}
                >
                  {targetProfile.is_verified ? 'VERIFIED' : 'PENDING'}
                </Badge>
              </div>

              <div className="space-y-6 border-t border-dashed border-gray-100 pt-4">
                <div className="space-y-1">
                  <div className="text-[0.6rem] font-black tracking-widest text-gray-400 uppercase">
                    Contact Signal
                  </div>
                  <div className="flex items-center gap-3 font-bold text-gray-900 uppercase italic">
                    <Mail className="h-4 w-4 text-orange-600" /> {targetProfile.email}
                  </div>
                  <div className="mt-1 flex items-center gap-3 font-bold text-gray-900 uppercase italic">
                    <Phone className="h-4 w-4 text-orange-600" />{' '}
                    {targetProfile.phone || 'NO PHONE'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[0.6rem] font-black tracking-widest text-gray-400 uppercase">
                    Role Protocol
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1 text-[0.6rem] font-black tracking-widest text-gray-900 uppercase">
                    <User className="h-3.5 w-3.5" /> {targetProfile.role}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[0.6rem] font-black tracking-widest text-gray-400 uppercase">
                    Nexus Ingestion
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold tracking-widest text-gray-500 uppercase">
                    <Clock className="h-4 w-4" />{' '}
                    {new Date(targetProfile.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {roleData?.bank_details && (
              <div className="space-y-6 rounded-[2.5rem] bg-[#1A1A1A] p-10 shadow-2xl">
                <div className="flex items-center gap-4">
                  <Banknote className="h-6 w-6 text-green-500" />
                  <h3 className="text-xl leading-none font-black tracking-tighter text-white uppercase italic">
                    Fiscal Ledger
                  </h3>
                </div>
                <div className="space-y-4 border-t border-white/5 pt-4">
                  {Object.entries(roleData.bank_details).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-end justify-between border-b border-white/5 pb-3"
                    >
                      <span className="text-[0.55rem] font-black tracking-widest text-gray-500 uppercase">
                        {key.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-white uppercase italic">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Documentation & Business Data */}
          <div className="space-y-12 lg:col-span-2">
            {/* Role Specific Data */}
            {targetProfile.role === 'vendor' && roleData && (
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase italic">
                    NODE SPECIFICATIONS
                  </h2>
                  <div className="h-0.5 flex-1 bg-gray-200"></div>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-4 rounded-[2.5rem] border border-gray-50 bg-white p-8 shadow-xl">
                    <div className="text-[0.6rem] font-black tracking-[0.3em] text-orange-600 uppercase">
                      Commercial Identity
                    </div>
                    <h4 className="text-2xl leading-none font-black text-gray-900 uppercase italic">
                      {roleData.business_name}
                    </h4>
                    <p className="text-sm leading-relaxed font-medium text-gray-500">
                      {roleData.description}
                    </p>
                  </div>
                  <div className="space-y-4 rounded-[2.5rem] border border-gray-50 bg-white p-8 shadow-xl">
                    <div className="text-[0.6rem] font-black tracking-[0.3em] text-orange-600 uppercase">
                      Tactical Grid
                    </div>
                    <div className="flex items-start gap-4">
                      <MapPin className="h-6 w-6 shrink-0 text-orange-600" />
                      <p className="text-sm font-bold text-gray-900 uppercase italic">
                        {roleData.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documentation Files */}
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase italic">
                  VALIDATION ASSETS
                </h2>
                <div className="h-0.5 flex-1 bg-gray-200"></div>
              </div>
              {roleData?.documents ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {Object.entries(roleData.documents).map(([key, value]) => (
                    <div
                      key={key}
                      className="group flex items-center justify-between rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-orange-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors group-hover:text-orange-600">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-[0.65rem] font-black text-gray-900 uppercase italic">
                            {key.replace('_', ' ')}
                          </div>
                          <div className="text-[0.55rem] font-bold tracking-widest text-gray-400 uppercase">
                            Validation Status: Pending
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-xl hover:bg-orange-50 hover:text-orange-600"
                        asChild
                      >
                        <a href={String(value)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[3rem] border-2 border-dashed border-gray-100 bg-white p-20 text-center">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-orange-200" />
                  <p className="text-[0.65rem] font-black tracking-widest text-gray-400 uppercase">
                    No documentation assets ingested yet
                  </p>
                </div>
              )}
            </div>

            {/* Audit Log (Simulated) */}
            <div className="space-y-6">
              <h3 className="text-xl font-black tracking-tighter text-gray-900 uppercase italic">
                Nexus Audit Log
              </h3>
              <div className="divide-y divide-gray-100 overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-xl">
                <div className="flex items-center justify-between bg-gray-50/50 p-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-[0.65rem] font-black text-gray-900 uppercase italic">
                      System Onboarding Complete
                    </span>
                  </div>
                  <span className="text-[0.55rem] font-bold text-gray-400">
                    {new Date(targetProfile.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
