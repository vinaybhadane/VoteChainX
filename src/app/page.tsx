"use client";

import React, { useState, useEffect } from "react";
import { useWeb3 } from "@/context/Web3Context"; 
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, loginWithMetaMask, logout, address, loading: contextLoading } = useWeb3();
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();

  // 🔄 Redirect Logic: Social/MetaMask Login -> Aadhaar Verification Page
  useEffect(() => {
    if (address) {
      setWalletAddress(address);
      
      // 🛡️ SECURITY STEP: Login ke baad seedha Aadhaar Verification par bhejo
      const timer = setTimeout(() => {
        console.log("Wallet Authenticated. Proceeding to Identity Verification...");
        router.push("/auth/identity"); // Path check kar lena agar alag ho toh
      }, 800); 

      return () => clearTimeout(timer);
    } else {
      setWalletAddress("");
    }
  }, [address, router]);

  // 🌐 Voter Login (Web3Auth/Google)
  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await login(); 
    } catch (error) {
      console.error("Login Error:", error);
      alert("Social login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🦊 Official Login (MetaMask)
  const handleMetaLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const addr = await loginWithMetaMask();
      if (addr) {
        console.log("MetaMask Connected:", addr);
      }
    } catch (error: any) {
      console.error("MetaMask Error:", error);
      if (error.code === 4001) {
        alert("Connection request rejected by user.");
      } else {
        alert("Could not connect to MetaMask. Ensure it's installed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial loading state
  if (contextLoading && !address) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center font-mono text-white">
        <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <p className="text-yellow-500 text-xs tracking-[0.3em] uppercase animate-pulse">Initializing Protocol...</p>
      </div>
    );
  }

  return (
    <main className="relative h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      {/* Background Section */}
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-[url('/mb_background.png')] md:bg-[url('/bg-image.jpg')]">
        <div className="absolute inset-0 bg-gradient-to-br from-black/95 via-black/85 to-black/95"></div>
      </div>
      
      {/* Visual Glows */}
      <div className="absolute w-[500px] h-[500px] bg-yellow-500/10 blur-[120px] rounded-full -top-20 -left-20 animate-pulse"></div>

      <div className="relative z-10 backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[2.5rem] shadow-2xl px-8 py-12 w-[90%] max-w-md text-center">
        <h1 className="text-6xl md:text-7xl font-black text-yellow-400 tracking-tighter drop-shadow-[0_0_20px_rgba(250,204,21,0.4)] uppercase">
          Login
        </h1>

        <p className="text-white mt-4 text-xs md:text-sm font-bold tracking-[0.3em] uppercase opacity-70">
          {walletAddress ? "Authentication Success" : "Official Citizen Voting Portal"}
        </p>

        <div className="w-16 h-[2px] bg-yellow-400 mx-auto mt-6 mb-12 rounded-full"></div>

        <div className="flex flex-col gap-5">
          {!walletAddress ? (
            <>
              {/* Main Voter Login */}
              <button 
                onClick={handleLogin}
                disabled={isLoading}
                className="relative group overflow-hidden rounded-2xl py-5 font-black tracking-widest transition-all active:scale-95 shadow-xl disabled:opacity-50"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></span>
                <span className="relative text-black uppercase text-sm">
                  {isLoading ? "Verifying..." : "Secure Voter Login"}
                </span>
              </button>

              <div className="flex items-center gap-4 my-2 opacity-30">
                <div className="h-[1px] bg-white flex-1"></div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Administrative</span>
                <div className="h-[1px] bg-white flex-1"></div>
              </div>

              {/* Administrative Login */}
              <button 
                onClick={handleMetaLogin}
                disabled={isLoading}
                className="relative group overflow-hidden rounded-2xl py-4 font-bold tracking-widest border border-yellow-500/40 text-yellow-500 transition-all hover:bg-yellow-500/10 active:scale-95 disabled:opacity-50"
              >
                <span className="relative uppercase text-[10px]">MetaMask Official Login</span>
              </button>
            </>
          ) : (
            /* Post-Login Feedback */
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-md animate-in fade-in zoom-in">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="text-white">✓</span>
              </div>
              <p className="text-yellow-500 text-[10px] uppercase mb-2 font-black tracking-widest">Voter ID Recognized</p>
              <p className="text-white font-mono text-[10px] break-all opacity-60">
                {walletAddress}
              </p>
              <p className="text-white text-xs mt-6 animate-pulse font-bold uppercase tracking-tighter">
                Redirecting to Identity Gateway...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 w-full flex flex-col items-center gap-4 px-4">
        <div className="flex items-center gap-4 opacity-60">
           <img src="/satyamev-jayate.png" alt="Emblem" className="h-10 grayscale invert" />
           <div className="h-6 w-[1px] bg-yellow-400/30"></div>
           <p className="text-white text-[10px] font-bold uppercase tracking-[0.3em]">
             Election Commission Protocol
           </p>
        </div>
      </div>
    </main>
  );
}