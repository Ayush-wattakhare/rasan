import { createClient, createServiceClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { 
  ShieldCheck, User, MapPin, Phone, Mail, 
  Clock, FileText, Banknote, CheckCircle, 
  AlertCircle, ArrowLeft, ExternalLink 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VerificationActions from '@/components/admin/verification-actions';

export default async function UserDossierPage(props: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  // Verify admin auth
  const { data: { user } } = await supabase.auth.getUser();
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
    const { data } = await serviceClient.from('vendors').select('*').eq('user_id', id).maybeSingle();
    roleData = data;
  } else if (targetProfile.role === 'delivery') {
    const { data } = await serviceClient.from('delivery_partners').select('*').eq('user_id', id).maybeSingle();
    roleData = data;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
       {/* ── TACTICAL HEADER ── */}
       <section className="relative overflow-hidden bg-[#1A1A1A] py-16 px-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="container mx-auto relative z-10">
             <Link href="/admin-dashboard/users" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 font-black uppercase tracking-widest text-[0.6rem]">
                <ArrowLeft className="w-4 h-4" /> Back to Nexus Population
             </Link>
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-6">
                   <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                      <ShieldCheck className="w-4 h-4 text-orange-500" />
                      <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">Personnel Dossier: {id.slice(0, 8).toUpperCase()}</span>
                   </div>
                   <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
                      {targetProfile.name}
                   </h1>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 flex items-center gap-4">
                   <VerificationActions 
                     userId={targetProfile.id} 
                     isVerified={targetProfile.is_verified} 
                     isActive={targetProfile.is_active} 
                   />
                </div>
             </div>
          </div>
       </section>

       <div className="container mx-auto px-8 -mt-10 relative z-20">
          <div className="grid lg:grid-cols-3 gap-12">
             {/* Left Column: Profile Card */}
             <div className="space-y-8">
                <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-600 font-black text-3xl italic">
                         {targetProfile.name.charAt(0)}
                      </div>
                      <Badge className={`${targetProfile.is_verified ? 'bg-green-600' : 'bg-orange-600'} text-white rounded-full px-4 h-8 font-black uppercase tracking-widest text-[0.6rem]`}>
                         {targetProfile.is_verified ? 'VERIFIED' : 'PENDING'}
                      </Badge>
                   </div>

                   <div className="space-y-6 pt-4 border-t border-dashed border-gray-100">
                      <div className="space-y-1">
                         <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Contact Signal</div>
                         <div className="flex items-center gap-3 text-gray-900 font-bold uppercase italic">
                            <Mail className="w-4 h-4 text-orange-600" /> {targetProfile.email}
                         </div>
                         <div className="flex items-center gap-3 text-gray-900 font-bold uppercase italic mt-1">
                            <Phone className="w-4 h-4 text-orange-600" /> {targetProfile.phone || 'NO PHONE'}
                         </div>
                      </div>

                      <div className="space-y-1">
                         <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Role Protocol</div>
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 text-gray-900 font-black uppercase tracking-widest text-[0.6rem]">
                            <User className="w-3.5 h-3.5" /> {targetProfile.role}
                         </div>
                      </div>

                      <div className="space-y-1">
                         <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">Nexus Ingestion</div>
                         <div className="flex items-center gap-3 text-gray-500 font-bold text-xs uppercase tracking-widest">
                            <Clock className="w-4 h-4" /> {new Date(targetProfile.created_at).toLocaleDateString()}
                         </div>
                      </div>
                   </div>
                </div>

                {roleData?.bank_details && (
                   <div className="bg-[#1A1A1A] rounded-[2.5rem] p-10 shadow-2xl space-y-6">
                      <div className="flex items-center gap-4">
                         <Banknote className="w-6 h-6 text-green-500" />
                         <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Fiscal Ledger</h3>
                      </div>
                      <div className="space-y-4 pt-4 border-t border-white/5">
                         {Object.entries(roleData.bank_details).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-end border-b border-white/5 pb-3">
                               <span className="text-[0.55rem] font-black text-gray-500 uppercase tracking-widest">{key.replace('_', ' ')}</span>
                               <span className="text-sm font-bold text-white uppercase italic">{String(value)}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>

             {/* Right Column: Documentation & Business Data */}
             <div className="lg:col-span-2 space-y-12">
                {/* Role Specific Data */}
                {targetProfile.role === 'vendor' && roleData && (
                   <div className="space-y-8">
                      <div className="flex items-center gap-6">
                         <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">NODE SPECIFICATIONS</h2>
                         <div className="h-0.5 flex-1 bg-gray-200"></div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 space-y-4">
                            <div className="text-[0.6rem] font-black text-orange-600 uppercase tracking-[0.3em]">Commercial Identity</div>
                            <h4 className="text-2xl font-black text-gray-900 uppercase italic leading-none">{roleData.business_name}</h4>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">{roleData.description}</p>
                         </div>
                         <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 space-y-4">
                            <div className="text-[0.6rem] font-black text-orange-600 uppercase tracking-[0.3em]">Tactical Grid</div>
                            <div className="flex items-start gap-4">
                               <MapPin className="w-6 h-6 text-orange-600 shrink-0" />
                               <p className="text-sm text-gray-900 font-bold uppercase italic">{roleData.address}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {/* Documentation Files */}
                <div className="space-y-8">
                   <div className="flex items-center gap-6">
                      <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">VALIDATION ASSETS</h2>
                      <div className="h-0.5 flex-1 bg-gray-200"></div>
                   </div>
                   {roleData?.documents ? (
                      <div className="grid md:grid-cols-2 gap-6">
                         {Object.entries(roleData.documents).map(([key, value]) => (
                            <div key={key} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center justify-between group hover:border-orange-200 transition-all">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-orange-600 transition-colors">
                                     <FileText className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <div className="text-[0.65rem] font-black text-gray-900 uppercase italic">{key.replace('_', ' ')}</div>
                                     <div className="text-[0.55rem] font-bold text-gray-400 uppercase tracking-widest">Validation Status: Pending</div>
                                  </div>
                               </div>
                               <Button size="icon" variant="ghost" className="rounded-xl hover:bg-orange-50 hover:text-orange-600" asChild>
                                  <a href={String(value)} target="_blank" rel="noopener noreferrer">
                                     <ExternalLink className="w-4 h-4" />
                                  </a>
                               </Button>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
                         <AlertCircle className="w-12 h-12 text-orange-200 mx-auto mb-4" />
                         <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">No documentation assets ingested yet</p>
                      </div>
                   )}
                </div>

                {/* Audit Log (Simulated) */}
                <div className="space-y-6">
                   <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Nexus Audit Log</h3>
                   <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 divide-y divide-gray-100 shadow-xl">
                      <div className="p-6 flex items-center justify-between bg-gray-50/50">
                         <div className="flex items-center gap-4">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-[0.65rem] font-black text-gray-900 uppercase italic">System Onboarding Complete</span>
                         </div>
                         <span className="text-[0.55rem] font-bold text-gray-400">{new Date(targetProfile.created_at).toLocaleString()}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
