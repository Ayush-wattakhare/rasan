import { Badge } from '@/components/ui/badge';

interface VendorHeaderProps {
  vendor: {
    business_name: string;
    description: string | null;
    cuisine_types: string[] | null;
    rating: number | null;
    total_reviews: number | null;
    address: string;
  };
}

export default function VendorHeader({ vendor }: VendorHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[3rem] bg-[#1A1A1A] p-8 md:p-12 shadow-2xl group">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
        <div className="relative">
           <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           <div className="relative flex h-32 w-32 md:h-40 md:w-40 items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-6xl md:text-7xl shadow-inner">
             👩‍🍳
           </div>
           <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-[#1A1A1A] flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
           </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[0.6rem] font-black uppercase tracking-[0.2em]">
              Master Chef Partner
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
              {vendor.business_name}
            </h1>
            {vendor.description && (
              <p className="text-lg text-gray-400 font-medium max-w-2xl italic leading-relaxed">
                &ldquo;{vendor.description}&rdquo;
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {vendor.cuisine_types?.map((cuisine) => (
              <span key={cuisine} className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[0.65rem] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                {cuisine}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start items-center gap-8 pt-4 border-t border-white/5">
            <div className="flex flex-col">
               <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-500">Global Rating</span>
               <div className="flex items-center gap-2">
                 <span className="text-2xl font-black text-white tracking-tighter">{(vendor.rating || 4.8).toFixed(1)}</span>
                 <div className="flex gap-0.5">
                   {[1,2,3,4,5].map(i => (
                     <span key={i} className="text-orange-500 text-xs">★</span>
                   ))}
                 </div>
                 <span className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-widest ml-1">
                   ({vendor.total_reviews || 100} reviews)
                 </span>
               </div>
            </div>

            <div className="flex flex-col">
               <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-500">Service Area</span>
               <div className="flex items-center gap-2 text-white/80 font-bold italic">
                 <span className="text-xl">📍</span>
                 {vendor.address.split(',')[0]}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
