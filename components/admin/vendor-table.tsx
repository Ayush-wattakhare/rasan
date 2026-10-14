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
import {
  Hash,
  User,
  Utensils,
  Star,
  Package,
  Activity,
  ShieldCheck,
  Clock,
  Store,
} from 'lucide-react';

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
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              BUSINESS_NODE
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              OWNER_ASSET
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              CUISINE_TYPE
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              METRICS
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              STATUS
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              JOINED
            </TableHead>
            <TableHead className="border-none px-6 text-right text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              ACTIONS
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.length === 0 ? (
            <TableRow className="border-none hover:bg-transparent">
              <TableCell colSpan={7} className="border-none py-32 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 text-gray-300">
                    <Store className="h-8 w-8" />
                  </div>
                  <p className="text-[0.7rem] font-black tracking-[0.3em] text-gray-400 uppercase italic">
                    No active nodes detected
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            vendors.map((vendor) => (
              <TableRow
                key={vendor.id}
                className="group relative rounded-[3rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 focus-within:z-30 hover:z-20 hover:shadow-[0_20px_50px_rgba(234,88,12,0.1)]"
              >
                <TableCell className="rounded-l-[3rem] border-none px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shadow-sm transition-all group-hover:bg-orange-600 group-hover:text-white">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-sm font-black tracking-tight text-gray-900 uppercase italic">
                        {vendor.business_name}
                      </p>
                      <p className="text-[0.6rem] font-bold tracking-widest text-gray-400 uppercase">
                        ID: {vendor.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="mb-1 text-[0.75rem] leading-none font-black text-gray-800 uppercase italic">
                        {vendor.profile?.name}
                      </div>
                      <div className="text-[0.6rem] font-bold tracking-tighter text-gray-400 uppercase">
                        {vendor.profile?.email}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex flex-wrap gap-2">
                    {vendor.cuisine_types.slice(0, 2).map((cuisine) => (
                      <Badge
                        key={cuisine}
                        variant="outline"
                        className="h-5 border-gray-100 bg-gray-50/50 px-3 text-[0.55rem] font-black tracking-widest text-gray-500 uppercase"
                      >
                        {cuisine}
                      </Badge>
                    ))}
                    {vendor.cuisine_types.length > 2 && (
                      <Badge
                        variant="outline"
                        className="h-5 border-orange-100 bg-orange-50/50 px-2 text-[0.55rem] font-black text-orange-600"
                      >
                        +{vendor.cuisine_types.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                      <span className="text-[0.75rem] font-black italic">
                        {vendor.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-[0.75rem] font-black italic">
                        {vendor.total_orders}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${vendor.is_active ? 'animate-pulse bg-green-500' : 'bg-gray-300'}`}
                      ></div>
                      <span className="text-[0.6rem] font-black tracking-widest text-gray-500 uppercase">
                        {vendor.is_active ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <Badge
                      className={`${vendor.is_verified ? 'bg-blue-600' : 'bg-orange-600'} border-none px-2 py-0 text-[0.55rem] font-black tracking-[0.1em] text-white uppercase`}
                    >
                      {vendor.is_verified ? 'VERIFIED' : 'PENDING'}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[0.65rem] font-bold tracking-tighter uppercase">
                      {formatDate(vendor.created_at, 'PP')}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="rounded-r-[3rem] border-none px-6 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedVendorForDocs(vendor)}
                      className="rounded-xl bg-gray-100 px-3 py-1.5 text-[0.6rem] font-black tracking-wider text-gray-600 uppercase transition-all hover:bg-orange-50 hover:text-orange-600"
                    >
                      Docs 📄
                    </button>
                    <VerificationActions
                      userId={vendor.user_id}
                      vendorId={vendor.id}
                      isVerified={vendor.is_verified}
                      isActive={vendor.is_active}
                      role="vendor"
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
