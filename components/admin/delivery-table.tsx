'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import VerificationActions from './verification-actions';
import { formatDate } from '@/lib/utils/format';
import { Truck, User, Clock, Star, ShieldCheck, Activity } from 'lucide-react';

interface DeliveryPartner {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
  is_online: boolean;
  is_verified: boolean;
  rating: number;
  total_deliveries: number;
  created_at: string;
  profile?: {
    name: string;
    email: string;
    phone: string | null;
  };
}

interface DeliveryTableProps {
  partners: DeliveryPartner[];
}

export default function DeliveryTable({ partners }: DeliveryTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="border-separate border-spacing-y-4 px-6 md:px-10">
        <TableHeader>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">RIDER IDENTITY</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">VEHICLE DETAILS</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">LICENSE NO.</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">METRICS</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">STATUS</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">JOINED</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6 text-right">DECISION ACTION</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.length === 0 ? (
            <TableRow className="hover:bg-transparent border-none">
              <TableCell colSpan={7} className="text-center py-32 border-none">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
                    <Truck className="w-8 h-8" />
                  </div>
                  <p className="text-[0.7rem] font-black text-gray-400 uppercase tracking-[0.3em] italic">No delivery partners found in registry</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            partners.map((partner) => (
              <TableRow key={partner.id} className="group border-none bg-white rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] transition-all duration-500 relative hover:z-20 focus-within:z-30">
                <TableCell className="px-6 py-6 border-none rounded-l-[3rem]">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                         <User className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-sm font-black text-gray-900 uppercase italic tracking-tight mb-0.5">{partner.profile?.name || 'Partner Rider'}</p>
                         <p className="text-[0.6rem] font-bold text-gray-400 tracking-widest uppercase">{partner.profile?.email}</p>
                      </div>
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[0.55rem] font-black uppercase tracking-widest px-3 h-5 border-indigo-100 bg-indigo-50/50 text-indigo-700">
                      {partner.vehicle_type}
                    </Badge>
                    <p className="text-xs font-mono font-bold text-gray-700">{partner.vehicle_number}</p>
                  </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                  <span className="text-xs font-mono font-bold text-gray-800">{partner.license_number || 'DL-PENDING'}</span>
                </TableCell>

                <TableCell className="px-6 py-6 border-none">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                         <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                         <span className="text-[0.75rem] font-black italic">{partner.rating ? partner.rating.toFixed(1) : '5.0'}</span>
                      </div>
                      <div className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">
                         {partner.total_deliveries || 0} Sorties
                      </div>
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                         <div className={`w-2 h-2 rounded-full ${partner.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                         <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-500">{partner.is_online ? 'ONLINE' : 'OFFLINE'}</span>
                      </div>
                      <Badge className={`${partner.is_verified ? 'bg-green-600' : 'bg-orange-600'} text-white text-[0.55rem] px-2 py-0 border-none font-black uppercase tracking-[0.1em]`}>
                         {partner.is_verified ? 'VERIFIED' : 'PENDING'}
                      </Badge>
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                   <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[0.65rem] font-bold uppercase tracking-tighter">{formatDate(partner.created_at, 'PP')}</span>
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none rounded-r-[3rem] text-right">
                    <VerificationActions 
                      userId={partner.user_id} 
                      isVerified={partner.is_verified} 
                      isActive={true} 
                    />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
