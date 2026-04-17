"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { AUTHORIZED_AADHAAR_LIST } from "@/constants/mockAadhaar";
import { useWeb3 } from "@/context/Web3Context";

export default function IdentityVerification() {
  const [aadhaar, setAadhaar] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { address, loading } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !address) {
      router.push("/");
    }
  }, [address, loading, router]);

  const handleVerify = async () => {
    setError("");
    if (aadhaar.length !== 12) {
      setError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      const isValid = AUTHORIZED_AADHAAR_LIST.includes(aadhaar);

      if (isValid) {
        const hashedId = ethers.keccak256(ethers.toUtf8Bytes(aadhaar));
        
        localStorage.setItem("userAadhaarHash", hashedId);
        localStorage.setItem("identityVerified", "true");

        router.push("/dashboard");
      } else {
        setError("Identity not found in National Voter Database.");
        setIsVerifying(false);
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100">
        
        {/* Top Branding Section - Original Emblem */}
        <div className="bg-gradient-to-r from-[#003366] to-[#004080] p-10 text-center">
          <img 
            src="/satyamev-jayate.png" 
            alt="Emblem" 
            className="h-20 mx-auto mb-4 drop-shadow-md" // Removed invert logic
          />
          <h2 className="text-white text-xl font-black tracking-tight uppercase">Identity Verification</h2>
          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-[0.2em] mt-1">Unique Identification Authority of India</p>
        </div>

        <div className="p-10 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-slate-900 font-black text-xl uppercase tracking-tighter">Aadhaar Authentication</h3>
            <p className="text-xs text-slate-500 font-medium">Please enter your 12-digit UID for secure validation</p>
          </div>

          {/* High Visibility Input Field */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                maxLength={12}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                placeholder="0000 0000 0000"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 text-center text-3xl font-mono font-black text-slate-900 tracking-[0.2em] focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
              />
            </div>
            
            {error && (
              <p className="text-red-600 text-[10px] font-black uppercase text-center flex items-center justify-center gap-1">
                <span>⚠️</span> {error}
              </p>
            )}
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying || aadhaar.length !== 12}
            className="w-full py-5 bg-[#0055b3] hover:bg-[#004494] text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
          >
            {isVerifying ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                VALIDATING ID...
              </>
            ) : "UNLOCK BALLOT UNIT"}
          </button>

          {/* Footer - Updated Digital India Logo */}
          <div className="pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
            <img src="/digital.png" alt="Digital India" className="h-10 opacity-80" />
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">Secure Protocol V2.6</p>
          </div>
        </div>
      </div>
    </main>
  );
}