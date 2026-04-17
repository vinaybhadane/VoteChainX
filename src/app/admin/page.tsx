"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/context/Web3Context";
import { CONTRACT_ADDRESS, ABI, ADMIN_ADDRESSES } from "@/constants"; // Import updated to Array
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { provider, address, loading } = useWeb3();
  const [electionTitle, setElectionTitle] = useState("");
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState(""); 
  const [duration, setDuration] = useState("60");
  const [isDeploying, setIsDeploying] = useState(false);
  const [adminElections, setAdminElections] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  
  // 🔑 CLOSING LOGIC STATES
  const [securityKeyInput, setSecurityKeyInput] = useState<{ [key: number]: string }>({});
  const [isClosing, setIsClosing] = useState<number | null>(null);

  // 🏛️ CUSTOM NOTIFICATION STATE
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const router = useRouter();

  // 🛡️ Double Admin Security Gate
  useEffect(() => {
    if (!loading && address) {
      const isAdmin = ADMIN_ADDRESSES.some(
        (admin: string) => admin.toLowerCase() === address.toLowerCase()
      );

      if (!isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [address, loading, router]);

  // 📊 Fetch Elections
  const fetchAdminElections = useCallback(async () => {
    const activeProvider = provider || (window as any).ethereum;
    if (!activeProvider) return;
    setIsFetching(true);
    try {
      const ethersProvider = new ethers.BrowserProvider(activeProvider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, ethersProvider);
      const count = Number(await contract.electionCount());
      const tempElections = [];

      for (let i = 1; i <= count; i++) {
        const details = await contract.getElectionDetails(i);
        const candidateList = [];
        for (let j = 1; j <= Number(details[3]); j++) {
          const c = await contract.getCandidate(i, j);
          candidateList.push({ id: Number(c[0]), name: c[1], voteCount: Number(c[2]) });
        }
        tempElections.push({
          id: i,
          title: details[0],
          endTime: Number(details[2]),
          active: details[4],
          candidates: candidateList,
          totalVotes: candidateList.reduce((acc, curr) => acc + curr.voteCount, 0)
        });
      }
      setAdminElections(tempElections.reverse());
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsFetching(false);
    }
  }, [provider]);

  useEffect(() => {
    if (address) fetchAdminElections();
  }, [address, fetchAdminElections]);

  // 🏛️ Create Election
  const createElection = async () => {
    const activeProvider = provider || (window as any).ethereum;
    if (!activeProvider || !electionTitle || !candidates) return;
    setIsDeploying(true);
    try {
      const ethersProvider = new ethers.BrowserProvider(activeProvider);
      const signer = await ethersProvider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const candidateList = candidates.split(",").map(c => c.trim()).filter(c => c !== "");

      const tx = await contract.createElection(
        electionTitle, 
        description || "Official Session", 
        parseInt(duration), 
        candidateList
      );
      await tx.wait();
      
      setNotification({ message: "PROCLAMATION SECURED: New Election Block Mined! 🏛️", type: "success" });
      
      setElectionTitle("");
      setCandidates("");
      fetchAdminElections();
    } catch (err) {
      setNotification({ message: "BLOCKCHAIN ERROR: Access Denied or Insufficient Power.", type: "error" });
    } finally {
      setIsDeploying(false);
    }
  };

  // 🔐 MANUAL CLOSE LOGIC
  const handleEndElection = async (id: number) => {
    if (securityKeyInput[id] !== "1234") {
      setNotification({ message: "SECURITY ALERT: Invalid Authorization Key.", type: "error" });
      return;
    }

    const activeProvider = provider || (window as any).ethereum;
    if (!activeProvider) return;
    setIsClosing(id);

    try {
      const ethersProvider = new ethers.BrowserProvider(activeProvider);
      const signer = await ethersProvider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.endElection(id);
      await tx.wait();
      
      setNotification({ message: `UNIT ${id} TERMINATED: Results Finalized on Ledger.`, type: "success" });
      fetchAdminElections();
    } catch (err) {
      setNotification({ message: "TERMINATION FAILED: Blockchain Reverted the Request.", type: "error" });
    } finally {
      setIsClosing(null);
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-yellow-500 font-mono">ENCRYPTING ADMIN SESSION...</div>;

  return (
    <main className="relative min-h-screen font-sans overflow-x-hidden selection:bg-yellow-500/30">
      
      {/* 🖼️ DYNAMIC RESPONSIVE BACKGROUND (Strictly same as Dashboard) */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat bg-fixed hidden md:block"
          style={{ backgroundImage: "url('/bg-image.jpg')" }}
        ></div>
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat bg-fixed block md:hidden"
          style={{ backgroundImage: "url('/mb_background.png')" }}
        ></div>
      </div>

      {/* 🏛️ PROFESSIONAL IN-PAGE POPUP (MODAL) */}
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className={`max-w-sm w-full bg-[#0f1115] border-2 rounded-[2rem] p-8 text-center shadow-2xl transition-all animate-in zoom-in duration-300 ${notification.type === 'success' ? 'border-green-500/50 shadow-green-500/10' : 'border-red-500/50 shadow-red-500/10'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${notification.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              <span className="text-3xl">{notification.type === 'success' ? '✓' : '⚠'}</span>
            </div>
            <h3 className={`text-lg font-black uppercase tracking-tighter mb-2 ${notification.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {notification.type === 'success' ? 'Command Successful' : 'Security Breach'}
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
              {notification.message}
            </p>
            <button 
              onClick={() => setNotification(null)}
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Professional Navbar */}
      <nav className="border-b border-white/10 bg-black/30 backdrop-blur-xl px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-500 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)]">
             <span className="text-black text-2xl">🏛️</span>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tighter uppercase leading-none text-white">Command <span className="text-yellow-500">Center</span></h2>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Electoral Control Unit</p>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')} className="text-[10px] font-black border border-white/20 bg-white/5 px-4 py-2 rounded-full hover:bg-white/10 transition-all tracking-widest uppercase text-white">Return to Dashboard</button>
      </nav>

      <div className="max-w-[1600px] mx-auto p-6 lg:p-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Create Election Form */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 sticky top-28">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-yellow-500 mb-8 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                New Proclamation
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] uppercase text-gray-500 font-black mb-2 block tracking-widest">Designation</label>
                  <input type="text" value={electionTitle} onChange={(e) => setElectionTitle(e.target.value)} placeholder="Lok Sabha 2026" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-yellow-500/50 transition-all text-white" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-gray-500 font-black mb-2 block tracking-widest">Mins</label>
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-yellow-500/50 text-white" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-[9px] text-gray-400 uppercase font-bold italic mb-2 tracking-tighter">Auto-Expire Enabled</p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-gray-500 font-black mb-2 block text-white tracking-widest">Candidate Manifest</label>
                  <textarea value={candidates} onChange={(e) => setCandidates(e.target.value)} placeholder="Modi, Rahul, Kejriwal..." className="w-full bg-black/50 border border-white/10 rounded-xl p-4 h-32 text-sm outline-none focus:border-yellow-500/50 resize-none text-white" />
                </div>

                <button onClick={createElection} disabled={isDeploying} className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50">
                  {isDeploying ? "Mining Block..." : "Authorize Election"}
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT: Live Monitor */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-end mb-4">
               <div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Live Monitor</h3>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Real-time Blockchain Ledger Feed</p>
               </div>
               <button onClick={fetchAdminElections} className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-lg border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all">REFRESH FEED</button>
            </div>

            {isFetching ? (
              <div className="grid gap-6 animate-pulse">
                {[1,2].map(i => <div key={i} className="h-48 bg-white/5 rounded-[2rem]"></div>)}
              </div>
            ) : (
              <div className="grid gap-6">
                {adminElections.map((election) => (
                  <div key={election.id} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 items-start shadow-xl">
                    
                    <div className="w-full md:w-56 text-left">
                       <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${election.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                         {election.active ? "● Live Counting" : "● Finalized"}
                       </span>
                       <h4 className="text-xl font-black mt-3 truncate text-white uppercase tracking-tighter">{election.title}</h4>
                       <p className="text-[10px] text-gray-400 font-mono mt-1">ID: #{election.id}</p>
                       <div className="mt-4">
                          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Total Votes</p>
                          <p className="text-3xl font-black text-yellow-500">{election.totalVotes}</p>
                       </div>

                       {election.active && (
                         <div className="mt-6 p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-3">
                            <p className="text-[8px] text-yellow-500 font-black uppercase tracking-widest">Security Override</p>
                            <input 
                              type="password" 
                              placeholder="Key" 
                              value={securityKeyInput[election.id] || ""}
                              onChange={(e) => setSecurityKeyInput({...securityKeyInput, [election.id]: e.target.value})}
                              className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-red-500/50 transition-all text-white" 
                            />
                            <button 
                              onClick={() => handleEndElection(election.id)}
                              disabled={isClosing === election.id}
                              className="w-full py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black uppercase rounded-lg transition-all border border-red-500/20"
                            >
                              {isClosing === election.id ? "Terminating..." : "End Session"}
                            </button>
                         </div>
                       )}
                    </div>

                    <div className="flex-1 w-full space-y-4 border-l border-white/10 pl-0 md:pl-8 pt-4 md:pt-0">
                       {election.candidates.map((c: any) => {
                         const percentage = election.totalVotes > 0 ? (c.voteCount / election.totalVotes) * 100 : 0;
                         return (
                           <div key={c.id} className="space-y-1">
                             <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white">
                               <span>{c.name}</span>
                               <span className="text-gray-400">{c.voteCount} Votes</span>
                             </div>
                             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-500 transition-all duration-1000 shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                             </div>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-20 border-t border-white/10 p-12 text-center opacity-40 relative z-10">
          <img src="/satyamev-jayate.png" alt="Emblem" className="h-8 grayscale invert mx-auto mb-4" />
          <p className="text-[9px] font-black tracking-[0.5em] uppercase text-white">Electoral Command & Control Unit</p>
      </footer>
    </main>
  );
}