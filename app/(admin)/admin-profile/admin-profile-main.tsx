'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ShieldCheck, User, Save, ShieldAlert, Fingerprint } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminProfileMain({ profile, userEmail }: any) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: formData.name, phone: formData.phone })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Clearance Updated',
        description: 'System administrator identity updated effectively.',
      });
    } catch (error: any) {
      toast({
        title: 'Authentication Failed',
        description: error.message || 'Could not update identity footprint',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* ── HEADER ── */}
      <section className="bg-[#1A1A1A] py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md w-fit mb-4">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.4em]">Root Clearance</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
              ADMINISTRATOR <br /> <span className="text-red-500">IDENTITY</span>
            </h1>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-8 relative z-20 space-y-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8 md:p-10 space-y-8">
                <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Identity Footprint</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Master Credentials</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-2">System Clearance Email (Read-Only)</Label>
                    <Input 
                      disabled
                      value={userEmail}
                      className="bg-gray-100 border-none h-14 rounded-2xl px-6 font-bold text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-2">Administrator Alias</Label>
                    <Input 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-none h-14 rounded-2xl px-6 font-bold focus-visible:ring-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-2">Secure Comm Link</Label>
                    <Input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-none h-14 rounded-2xl px-6 font-bold focus-visible:ring-red-500"
                      placeholder="+91..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full h-16 rounded-[1.5rem] bg-[#1A1A1A] hover:bg-red-600 text-white font-black uppercase tracking-widest shadow-xl transition-all"
            >
              {isSaving ? (
                <span className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 animate-pulse" /> Committing Changes...</span>
              ) : (
                <span className="flex items-center gap-3"><Save className="w-5 h-5" /> Commit Clearance Patch</span>
              )}
            </Button>
          </div>

          <div className="space-y-8">
            <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 text-center space-y-4">
              <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
              <h3 className="font-black text-gray-900 uppercase italic tracking-tighter text-xl">Authority Warning</h3>
              <p className="text-sm font-medium text-gray-600">You are operating under Root Level directives. Changes made from this terminal affect global system states.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
