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
import { Hash, User, Utensils, Star, Package, Activity, ShieldCheck, Clock, Store } from 'lucide-react';

interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  cuisine_types: string[];
  is_active: boolean;
  is_verified: boolean;
  rating: number;
  total_orders: number;
  created_at: string;
  profile?: {
    name: string;
    email: string;
  };
}

interface VendorTableProps {
  vendors: Vendor[];
}

import { useState } from 'react';
import { VendorDocumentModal } from './vendor-document-modal';

export default function VendorTable({ vendors }: VendorTableProps) {
  const [selectedVendorForDocs, setSelectedVendorForDocs] = useState<Vendor | null>(null);

  return (
    <div className="overflow-x-auto">
      {selectedVendorForDocs && (
        <VendorDocumentModal
          vendor={{
            id: selectedVendorForDocs.id,
            business_name: selectedVendorForDocs.business_name,
          }}
          onClose={() => setSelectedVendorForDocs(null)}
        />
      )}
      <Table className="border-separate border-spacing-y-4 px-6 md:px-10">
        <TableHeader>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">BUSINESS_NODE</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">OWNER_ASSET</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">CUISINE_TYPE</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">METRICS</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">STATUS</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">JOINED</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6 text-right">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.length === 0 ? (
            <TableRow className="hover:bg-transparent border-none">
              <TableCell colSpan={7} className="text-center py-32 border-none">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
                    <Store className="w-8 h-8" />
                  </div>
                  <p className="text-[0.7rem] font-black text-gray-400 uppercase tracking-[0.3em] italic">No active nodes detected</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            vendors.map((vendor) => (
              <TableRow key={vendor.id} className="group border-none bg-white rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(234,88,12,0.1)] transition-all duration-500 relative hover:z-20 focus-within:z-30">
                <TableCell className="px-6 py-6 border-none rounded-l-[3rem]">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                         <Hash className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-sm font-black text-gray-900 uppercase italic tracking-tight mb-0.5">{vendor.business_name}</p>
                         <p className="text-[0.6rem] font-bold text-gray-400 tracking-widest uppercase">ID: {vendor.id.slice(0, 8)}</p>
                      </div>
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                       <User className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[0.75rem] font-black text-gray-800 uppercase italic leading-none mb-1">{vendor.profile?.name}</div>
                        <div className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-tighter">{vendor.profile?.email}</div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                  <div className="flex flex-wrap gap-2">
                    {vendor.cuisine_types.slice(0, 2).map((cuisine) => (
                      <Badge key={cuisine} variant="outline" className="text-[0.55rem] font-black uppercase tracking-widest px-3 h-5 border-gray-100 bg-gray-50/50 text-gray-500">
                        {cuisine}
                      </Badge>
                    ))}
                    {vendor.cuisine_types.length > 2 && (
                      <Badge variant="outline" className="text-[0.55rem] font-black px-2 h-5 border-orange-100 bg-orange-50/50 text-orange-600">
                        +{vendor.cuisine_types.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                         <span className="text-[0.75rem] font-black italic">{vendor.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Package className="w-3.5 h-3.5 text-gray-400" />
                         <span className="text-[0.75rem] font-black italic">{vendor.total_orders}</span>
                      </div>
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${vendor.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                         <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-500">{vendor.is_active ? 'ONLINE' : 'OFFLINE'}</span>
                      </div>
                      <Badge className={`${vendor.is_verified ? 'bg-blue-600' : 'bg-orange-600'} text-white text-[0.55rem] px-2 py-0 border-none font-black uppercase tracking-[0.1em]`}>
                         {vendor.is_verified ? 'VERIFIED' : 'PENDING'}
                      </Badge>
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                   <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[0.65rem] font-bold uppercase tracking-tighter">{formatDate(vendor.created_at, 'PP')}</span>
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none rounded-r-[3rem] text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedVendorForDocs(vendor)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-600 text-[0.6rem] font-black uppercase tracking-wider transition-all"
                      >
                        Docs 📄
                      </button>
                      <VerificationActions 
                        userId={vendor.user_id} 
                        isVerified={vendor.is_verified} 
                        isActive={vendor.is_active} 
                      />
                    </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
