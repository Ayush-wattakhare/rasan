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
  documents?: any;
  created_at: string;
  profile?: {
    name: string;
    email: string;
    phone: string | null;
    is_active?: boolean;
    is_verified?: boolean;
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
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              RIDER IDENTITY
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              VEHICLE DETAILS
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              LICENSE NO.
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
              DECISION ACTION
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.length === 0 ? (
            <TableRow className="border-none hover:bg-transparent">
              <TableCell colSpan={7} className="border-none py-32 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 text-gray-300">
                    <Truck className="h-8 w-8" />
                  </div>
                  <p className="text-[0.7rem] font-black tracking-[0.3em] text-gray-400 uppercase italic">
                    No delivery partners found in registry
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            partners.map((partner) => (
              <TableRow
                key={partner.id}
                className="group relative rounded-[3rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 focus-within:z-30 hover:z-20 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)]"
              >
                <TableCell className="rounded-l-[3rem] border-none px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm transition-all group-hover:bg-indigo-600 group-hover:text-white">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-sm font-black tracking-tight text-gray-900 uppercase italic">
                        {partner.profile?.name || 'Partner Rider'}
                      </p>
                      <p className="text-[0.6rem] font-bold tracking-widest text-gray-400 uppercase">
                        {partner.profile?.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="space-y-1">
                    <Badge
                      variant="outline"
                      className="h-5 border-indigo-100 bg-indigo-50/50 px-3 text-[0.55rem] font-black tracking-widest text-indigo-700 uppercase"
                    >
                      {partner.vehicle_type}
                    </Badge>
                    <p className="font-mono text-xs font-bold text-gray-700">
                      {partner.vehicle_number}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <span className="font-mono text-xs font-bold text-gray-800">
                    {partner.license_number || 'DL-PENDING'}
                  </span>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      <span className="text-[0.75rem] font-black italic">
                        {partner.rating ? partner.rating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                    <div className="text-[0.65rem] font-black tracking-widest text-gray-400 uppercase">
                      {partner.total_deliveries || 0} Sorties
                    </div>
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-2 w-2 rounded-full ${partner.is_online ? 'animate-pulse bg-green-500' : 'bg-gray-300'}`}
                      ></div>
                      <span className="text-[0.6rem] font-black tracking-widest text-gray-500 uppercase">
                        {partner.is_online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <Badge
                      className={`${
                        partner.is_verified
                          ? 'bg-green-600'
                          : partner.documents?.application_status === 'declined'
                            ? 'bg-red-600'
                            : partner.documents?.application_status === 'blocked'
                              ? 'bg-red-800'
                              : 'bg-orange-600'
                      } border-none px-2 py-0 text-[0.55rem] font-black tracking-[0.1em] text-white uppercase`}
                    >
                      {partner.is_verified
                        ? 'VERIFIED'
                        : partner.documents?.application_status === 'declined'
                          ? 'DECLINED'
                          : partner.documents?.application_status === 'blocked'
                            ? 'BLOCKED'
                            : 'PENDING'}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[0.65rem] font-bold tracking-tighter uppercase">
                      {formatDate(partner.created_at, 'PP')}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="rounded-r-[3rem] border-none px-6 py-6 text-right">
                  <VerificationActions
                    userId={partner.user_id}
                    partnerId={partner.id}
                    isVerified={partner.is_verified}
                    isActive={partner.profile?.is_active ?? true}
                    applicationStatus={partner.documents?.application_status}
                    role="delivery"
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
