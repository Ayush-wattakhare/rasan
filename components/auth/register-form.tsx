"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChefHat, Bike, User, ShieldCheck, Upload, X, CheckCircle2, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";

type UserRole = "customer" | "vendor" | "delivery";

const STEPS_VENDOR = ["Account", "Business", "Documents"];
const STEPS_DELIVERY = ["Account", "Vehicle", "Documents"];

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "customer";

  const [role, setRole] = useState<UserRole>(initialRole);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Account fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Vendor fields
  const [businessName, setBusinessName] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [fssai, setFssai] = useState("");
  const [gst, setGst] = useState("");
  const [address, setAddress] = useState("");
  const [cuisines, setCuisines] = useState("");

  // Delivery fields
  const [vehicleType, setVehicleType] = useState("bike");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [aadhaar, setAadhaar] = useState("");

  useEffect(() => {
    const r = searchParams.get("role") as UserRole;
    if (r && ["customer", "vendor", "delivery"].includes(r)) setRole(r);
  }, [searchParams]);

  const steps = role === "vendor" ? STEPS_VENDOR : role === "delivery" ? STEPS_DELIVERY : [];
  const totalSteps = steps.length || 1;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setDocFile(f);
    const url = URL.createObjectURL(f);
    setDocPreview(url);
  };

  const validateStep = () => {
    if (step === 0) {
      if (!name || !email || !phone || !password || !confirmPassword) return "Please fill all fields.";
      if (password !== confirmPassword) return "Passwords do not match.";
      if (password.length < 6) return "Password must be at least 6 characters.";
    }
    if (step === 1 && role === "vendor") {
      if (!businessName || !address) return "Business name and address are required.";
    }
    if (step === 1 && role === "delivery") {
      if (!vehicleNumber || !licenseNumber) return "Vehicle number and license number are required.";
    }
    return "";
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, phone } },
      });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }
      if (authData.user) {
        const res = await fetch("/api/auth/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: authData.user.id,
            email,
            name,
            phone,
            role,
            businessName,
            businessDesc,
            fssai,
            gst,
            address,
            cuisines,
            vehicleType,
            vehicleNumber,
            licenseNumber,
            aadhaar,
          }),
        });
        const result = await res.json();
        if (!res.ok) {
          setError(res.status === 409 ? "Account already exists. Please login." : `Error: ${result.error}`);
          setLoading(false); return;
        }
        const redirectTo = searchParams.get("redirectTo");
        if (role === "customer" && redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
          router.push(redirectTo);
        } else {
          switch (role) {
            case "customer": router.push("/dashboard"); break;
            case "vendor": router.push("/vendor-dashboard"); break;
            case "delivery": router.push("/delivery-dashboard"); break;
          }
        }
        router.refresh();
      }
    } catch { setError("An unexpected error occurred."); setLoading(false); }
  };

  const roleConfig = {
    vendor: { icon: ChefHat, label: "Vendor Partner", color: "from-orange-600 to-red-600", accent: "orange" },
    delivery: { icon: Bike, label: "Delivery Partner", color: "from-indigo-600 to-purple-600", accent: "indigo" },
    customer: { icon: User, label: "Customer", color: "from-gray-800 to-gray-900", accent: "orange" },
  }[role];

  const Icon = roleConfig.icon;

  if (role === "customer") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-orange-600 rounded-2xl items-center justify-center mb-4 shadow-2xl shadow-orange-600/30">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tight">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join Rasan and order home-cooked meals</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">{error}</div>}
            <div className="space-y-4">
              <Field label="Full Name" id="name" value={name} onChange={setName} placeholder="John Doe" />
              <Field label="Email" id="email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <Field label="Phone" id="phone" type="tel" value={phone} onChange={setPhone} placeholder="+91 00000 00000" />
              <div className="grid grid-cols-2 gap-3">
                <PasswordField label="Password" value={password} onChange={setPassword} show={showPass} onToggle={() => setShowPass(p => !p)} />
                <Field label="Confirm" id="confirm" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} className="mt-6 w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50">
              {loading ? "Creating..." : "Create Account"}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">Already have an account? <Link href={searchParams.get("redirectTo") ? `/login?redirectTo=${encodeURIComponent(searchParams.get("redirectTo")!)}` : "/login"} className="text-orange-500 hover:underline font-bold">Sign in</Link></p>
          </div>
          <div className="text-center mt-4">
            <p className="text-xs text-gray-600">Want to partner? <Link href="/register?role=vendor" className="text-orange-500">Become a Vendor</Link> · <Link href="/register?role=delivery" className="text-indigo-400">Deliver with us</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* LEFT PANEL */}
      <div className={`hidden lg:flex lg:w-2/5 flex-col justify-between p-12 bg-gradient-to-br ${roleConfig.color} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-black/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">Rasan</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex px-3 py-1.5 bg-white/10 rounded-full border border-white/20 backdrop-blur">
            <span className="text-white/80 text-[0.6rem] font-black uppercase tracking-[0.3em]">{roleConfig.label} Application</span>
          </div>
          <h2 className="text-5xl font-black text-white leading-none uppercase italic">
            {role === "vendor" ? <>Launch Your<br /><span className="text-white/60">Kitchen</span></> : <>Own The<br /><span className="text-white/60">Streets</span></>}
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            {role === "vendor" ? "Turn your passion for cooking into a thriving business. Reach thousands of customers in your neighborhood." : "Deliver with freedom. Set your schedule, maximize earnings, and be part of a growing network."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(role === "vendor" ? [
              { label: "Avg. Monthly Revenue", value: "₹45,000+" },
              { label: "Active Customers", value: "2,500+" },
              { label: "Onboarding Time", value: "48 Hours" },
              { label: "Commission Rate", value: "Only 7%" },
            ] : [
              { label: "Weekly Earnings", value: "₹8,500+" },
              { label: "Active Orders/Day", value: "35+" },
              { label: "Payment Cycle", value: "Weekly" },
              { label: "Fuel Incentives", value: "Included" },
            ]).map(s => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-4 backdrop-blur border border-white/10">
                <div className="text-white font-black text-xl">{s.value}</div>
                <div className="text-white/50 text-[0.6rem] uppercase tracking-widest font-bold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur">
            <ShieldCheck className="w-5 h-5 text-white/80 shrink-0" />
            <p className="text-white/70 text-xs leading-relaxed">All applications are reviewed within 24-48 hours. Your information is encrypted and secure.</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${i <= step ? "text-white" : "text-gray-600"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-black border ${i < step ? "bg-green-500 border-green-500" : i === step ? "bg-white text-black border-white" : "border-gray-700 text-gray-600"}`}>
                    {i < step ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:block text-[0.65rem] font-black uppercase tracking-widest">{s}</span>
                </div>
                {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-green-500" : "bg-gray-700"}`} />}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Already registered? <Link href={searchParams.get("redirectTo") ? `/login?redirectTo=${encodeURIComponent(searchParams.get("redirectTo")!)}` : "/login"} className="text-orange-500 font-bold hover:underline">Sign in</Link></p>
        </div>

        {/* Form Body */}
        <div className="flex-1 flex items-start justify-center p-6 lg:p-12">
          <div className="w-full max-w-2xl">
            {error && <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest">{error}</div>}

            {/* STEP 0: Account */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Account Setup</h2>
                  <p className="text-gray-500 text-sm mt-1">Your login credentials and basic contact information</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DarkField label="Full Name" id="name" value={name} onChange={setName} placeholder="John Doe" />
                  <DarkField label="Email Address" id="email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                  <DarkField label="Phone Number" id="phone" type="tel" value={phone} onChange={setPhone} placeholder="+91 00000 00000" />
                  <div />
                  <div className="relative">
                    <label htmlFor="password" className="block text-[0.65rem] font-black uppercase tracking-widest text-gray-500 mb-2">Password</label>
                    <input id="password" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pr-10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all" />
                    <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-[2.4rem] text-gray-500 hover:text-gray-300">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                  <DarkField label="Confirm Password" id="confirm" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter password" />
                </div>
              </div>
            )}

            {/* STEP 1: Vendor - Business */}
            {step === 1 && role === "vendor" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Business Details</h2>
                  <p className="text-gray-500 text-sm mt-1">Tell us about your kitchen and culinary expertise</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DarkField label="Business / Kitchen Name" id="bname" value={businessName} onChange={setBusinessName} placeholder="e.g. Amma's Kitchen" />
                  <DarkField label="Cuisine Types" id="cuisine" value={cuisines} onChange={setCuisines} placeholder="e.g. Indian, Chinese, Italian" />
                  <DarkField label="FSSAI License Number" id="fssai" value={fssai} onChange={setFssai} placeholder="14-digit FSSAI number" />
                  <DarkField label="GST Number (Optional)" id="gst" value={gst} onChange={setGst} placeholder="22AAAAA0000A1Z5" />
                  <div className="col-span-full">
                    <label className="block text-[0.65rem] font-black uppercase tracking-widest text-gray-500 mb-2">Kitchen Address</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address with city and pincode" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 transition-all resize-none" />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-[0.65rem] font-black uppercase tracking-widest text-gray-500 mb-2">About Your Kitchen</label>
                    <textarea value={businessDesc} onChange={e => setBusinessDesc(e.target.value)} placeholder="Describe your specialties, signature dishes, and cooking style..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 transition-all resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Delivery - Vehicle */}
            {step === 1 && role === "delivery" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Vehicle Details</h2>
                  <p className="text-gray-500 text-sm mt-1">Your vehicle information for delivery operations</p>
                </div>
                <div className="space-y-3">
                  <label className="block text-[0.65rem] font-black uppercase tracking-widest text-gray-500">Vehicle Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ v: "bike", label: "Motorcycle", emoji: "🏍️" }, { v: "scooter", label: "Scooter", emoji: "🛵" }, { v: "cycle", label: "Bicycle", emoji: "🚲" }].map(opt => (
                      <button key={opt.v} type="button" onClick={() => setVehicleType(opt.v)} className={`p-4 rounded-2xl border text-center transition-all ${vehicleType === opt.v ? "bg-indigo-600/20 border-indigo-500 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}>
                        <div className="text-3xl mb-1">{opt.emoji}</div>
                        <div className="text-xs font-black uppercase tracking-widest">{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DarkField label="Vehicle Registration Number" id="vnum" value={vehicleNumber} onChange={setVehicleNumber} placeholder="e.g. MH 01 AB 1234" />
                  <DarkField label="Driving License Number" id="lnum" value={licenseNumber} onChange={setLicenseNumber} placeholder="DL number" />
                  <DarkField label="Aadhaar Number" id="aadhaar" value={aadhaar} onChange={setAadhaar} placeholder="12-digit Aadhaar" />
                  <DarkField label="Emergency Contact" id="emergency" value="" onChange={() => {}} placeholder="+91 00000 00000" />
                </div>
              </div>
            )}

            {/* STEP 2: Documents */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Verification Documents</h2>
                  <p className="text-gray-500 text-sm mt-1">Upload a clear photo of your {role === "vendor" ? "FSSAI certificate or ID proof" : "driving license or Aadhaar card"}</p>
                </div>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all group ${docPreview ? "border-green-500/40 bg-green-500/5" : "border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/5"}`}
                >
                  {docPreview ? (
                    <div className="space-y-4">
                      <img src={docPreview} alt="Document preview" className="max-h-48 mx-auto rounded-2xl object-contain" />
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-bold">{docFile?.name}</span>
                      </div>
                      <button type="button" onClick={e => { e.stopPropagation(); setDocPreview(null); setDocFile(null); }} className="flex items-center gap-1 mx-auto text-xs text-red-400 hover:text-red-300">
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-white/10 transition-all">
                        <Upload className="w-8 h-8 text-gray-500 group-hover:text-gray-300 transition-colors" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Click to upload document</p>
                        <p className="text-gray-500 text-xs mt-1">JPG, PNG or PDF — Max 5MB</p>
                      </div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(role === "vendor" ? ["FSSAI Certificate", "Business PAN Card", "Aadhaar Card", "Bank Passbook"] : ["Driving License", "Vehicle RC", "Aadhaar Card", "Insurance Copy"]).map(doc => (
                    <div key={doc} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                      <span className="text-xs text-gray-400 font-medium">{doc}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">Verification Notice</p>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">Your documents are encrypted and reviewed only by our compliance team. Approval takes 24–48 hours after submission.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
              {step > 0 ? (
                <button type="button" onClick={() => { setError(""); setStep(s => s - 1); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold text-sm">
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
              ) : <div />}
              {step < totalSteps - 1 ? (
                <button type="button" onClick={nextStep} className={`flex items-center gap-2 px-8 h-14 bg-gradient-to-r ${roleConfig.color} text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:opacity-90 active:scale-95`}>
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading} className={`flex items-center gap-2 px-8 h-14 bg-gradient-to-r ${roleConfig.color} text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:opacity-90 disabled:opacity-50 active:scale-95`}>
                  {loading ? "Submitting..." : "Submit Application"} {!loading && <CheckCircle2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DarkField({ label, id, type = "text", value, onChange, placeholder }: { label: string; id: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[0.65rem] font-black uppercase tracking-widest text-gray-500 mb-2">{label}</label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all" />
    </div>
  );
}

function Field({ label, id, type = "text", value, onChange, placeholder }: { label: string; id: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[0.65rem] font-black uppercase tracking-widest text-gray-500 mb-2">{label}</label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full h-12 bg-gray-100 border border-gray-200 rounded-xl px-4 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-400 transition-all" />
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div className="relative">
      <label htmlFor="password" className="block text-[0.65rem] font-black uppercase tracking-widest text-gray-500 mb-2">{label}</label>
      <input id="password" type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder="Min. 6 chars" className="w-full h-12 bg-gray-100 border border-gray-200 rounded-xl px-4 pr-10 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-400 transition-all" />
      <button type="button" onClick={onToggle} className="absolute right-3 top-[2.4rem] text-gray-400 hover:text-gray-600">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
    </div>
  );
}
