"use client";

import { useWeb3 } from "@/context/Web3Context";
import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "@/constants";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { provider, address, loading, logout } = useWeb3();
  const [elections, setElections] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [receiptData, setReceiptData] = useState<any>(null); 
  const router = useRouter();

  // 🛡️ SECURITY GATE
  useEffect(() => {
    const isVerified = localStorage.getItem("identityVerified");
    if (!loading) {
      if (!address) router.push("/");
      else if (isVerified !== "true") router.push("/auth/identity");
    }
  }, [address, loading, router]);

  const fetchElections = useCallback(async () => {
    const activeProvider = provider || (window as any).ethereum;
    if (!activeProvider || !address) return;

    setIsFetching(true);
    try {
      const ethersProvider = new ethers.BrowserProvider(activeProvider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, ethersProvider);
      const count = await contract.electionCount();
      const tempElections = [];

      for (let i = 1; i <= Number(count); i++) {
        const details = await contract.getElectionDetails(i);
        
        // 🔒 STRICT FILTER: Sirf active elections hi show hongi
        if (details[4] === true) {
          const candidateList = [];
          for (let j = 1; j <= Number(details[3]); j++) {
            const c = await contract.getCandidate(i, j);
            candidateList.push({ 
              id: Number(c[0]), 
              name: c[1] 
              // ❌ Removed voteCount from state to maintain strict privacy
            });
          }
          tempElections.push({ id: i, title: details[0], active: details[4], candidates: candidateList });
        }
      }
      setElections(tempElections);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setIsFetching(false); 
    }
  }, [provider, address]);

  useEffect(() => { if (address) fetchElections(); }, [address, fetchElections]);

  // 🔥 GASLESS VOTING LOGIC
  const handleVote = async (electionId: number, candidateId: number) => {
    const activeProvider = provider || (window as any).ethereum;
    if (!activeProvider) return;

    const hashedAadhaar = localStorage.getItem("userAadhaarHash");
    if (!hashedAadhaar) {
      setErrorMsg("Security hash missing. Please login again.");
      setShowErrorModal(true);
      return;
    }

    const uniqueId = `${electionId}-${candidateId}`;
    setVotingId(uniqueId);
    
    try {
      const ethersProvider = new ethers.BrowserProvider(activeProvider);
      const signer = await ethersProvider.getSigner();
      const voterAddress = await signer.getAddress();

      // Sign the vote data (FREE)
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address", "bytes32"],
        [electionId, candidateId, voterAddress, hashedAadhaar]
      );

      const signature = await signer.signMessage(ethers.getBytes(messageHash));

      // Admin pays gas via Relayer API
      const response = await fetch("/api/relayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electionId,
          candidateId,
          voter: voterAddress,
          signature,
          hashedId: hashedAadhaar
        }),
      });

      const result = await response.json();

      if (result.success) {
        const audio = new Audio("/beep.mp3");
        audio.play().catch(e => {});

        const currentElection = elections.find(e => e.id === electionId);
        setReceiptData({
          voter: voterAddress,
          election: currentElection?.title,
          candidate: currentElection?.candidates.find((c:any) => c.id === candidateId)?.name,
          txnHash: result.txHash,
          timestamp: new Date().toLocaleString()
        });

        setShowSuccessModal(true);
        fetchElections(); 
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message.includes("already") ? "IDENTITY LOCK: Our records show you have already participated in this voting session." : "VOTE REJECTED: Identity mismatch or session expired.");
      setShowErrorModal(true);
    } finally { 
      setVotingId(null); 
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center font-mono text-white text-xs tracking-widest uppercase animate-pulse">
      Accessing Secure Ledger...
    </div>
  );

  return (
    <div className="relative min-h-screen font-sans overflow-x-hidden">
      
      {/* 🖼️ DYNAMIC RESPONSIVE BACKGROUND */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-black/65 z-10"></div>
        <div 
          className="w-full h-full bg-cover bg-center hidden md:block"
          style={{ backgroundImage: "url('/bg-image.jpg')" }}
        ></div>
        <div 
          className="w-full h-full bg-cover bg-center block md:hidden"
          style={{ backgroundImage: "url('/mb_background.png')" }}
        ></div>
      </div>

      {/* 🏛️ RECEIPT MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white max-w-sm w-full rounded-sm shadow-2xl border-t-[10px] border-blue-900 relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
               <h1 className="text-[100px] font-black -rotate-45">SECURE</h1>
            </div>
            <div className="p-8 space-y-6 relative z-10 text-slate-800">
              <div className="flex justify-between items-center border-b-2 pb-4">
                <img src="/satyamev-jayate.png" alt="Emblem" className="h-10" />
                <span className="bg-green-100 text-green-700 text-[8px] px-2 py-1 font-black rounded uppercase">VERIFIED</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-center text-xs font-black tracking-[0.2em] uppercase">E-Ballot Receipt</h3>
                <div className="grid gap-2 text-[9px] font-mono">
                  <div className="flex justify-between"><span>VOTER ID:</span> <span className="truncate ml-4">{receiptData?.voter.slice(0, 15)}...</span></div>
                  <div className="flex justify-between"><span>SESSION:</span> <span className="font-bold">{receiptData?.election}</span></div>
                  <div className="flex justify-between"><span>CHOICE:</span> <span className="text-blue-700 font-black">{receiptData?.candidate}</span></div>
                  <div className="flex justify-between"><span>TIMESTAMP:</span> <span>{receiptData?.timestamp}</span></div>
                </div>
                <p className="text-[7px] text-slate-400 break-all border-t border-dashed pt-2 mt-4">TRANSACTION: {receiptData?.txnHash}</p>
              </div>
              <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 bg-blue-900 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Close Ballot</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 RED ALERT MODAL */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
          <div className="bg-[#121212] border-2 border-red-600 max-w-sm w-full rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <div className="w-14 h-14 bg-red-600/20 border-2 border-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 font-black text-2xl">!</div>
            <h2 className="text-white text-lg font-black uppercase tracking-tighter mb-2">Access Denied</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">{errorMsg}</p>
            <button onClick={() => setShowErrorModal(false)} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all">Acknowledge</button>
          </div>
        </div>
      )}

      <header className="bg-black/30 backdrop-blur-xl px-8 py-4 flex justify-between items-center border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-sm"><img src="/satyamev-jayate.png" alt="Emblem" className="h-10" /></div>
          <div>
            <h1 className="text-white text-lg font-black tracking-tight leading-none uppercase">Election Commission</h1>
            <p className="text-[8px] text-yellow-400 font-mono tracking-[0.2em] mt-1">SECURE VOTECHAIN-X UNIT</p>
          </div>
        </div>
        <button onClick={() => logout()} className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded text-[10px] font-black uppercase transition-all">End Session</button>
      </header>

      <main className="p-6 md:p-10 max-w-5xl mx-auto">
        {isFetching ? (
          <div className="text-center py-40 flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <p className="text-white/40 text-[10px] font-black tracking-[0.3em] uppercase tracking-widest">Initialising Ballot...</p>
          </div>
        ) : elections.length === 0 ? (
          <div className="text-center py-32 bg-black/20 border border-white/5 rounded-[3rem] backdrop-blur-md">
             <p className="text-white/20 font-black text-2xl uppercase tracking-widest">No Active Voting Sessions</p>
          </div>
        ) : (
          <div className="space-y-32">
            {elections.map((election) => (
              <div key={election.id} className="relative group max-w-2xl mx-auto">
                <div className="bg-[#e0e0e0] border-x-[12px] border-t-[12px] border-b-[32px] border-[#c0c0c0] rounded-t-xl rounded-b-[50px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
                  <div className="bg-[#d1d1d1] p-5 flex justify-between items-center border-b-2 border-gray-400">
                    <div className="flex items-center gap-3">
                       <div className="w-5 h-5 rounded-full bg-green-500 shadow-[0_0_15px_#22c55e]"></div>
                       <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Ready to Vote</span>
                    </div>
                    <div className="text-right font-black text-slate-800 uppercase text-xs tracking-tighter">Unit ID: 0{election.id}</div>
                  </div>

                  <div className="bg-[#f0f0f0] p-1.5">
                    {election.candidates.map((c: any, index: number) => {
                      const isVoting = votingId === `${election.id}-${c.id}`;
                      return (
                        <div key={c.id} className="flex border-b border-gray-300 items-stretch h-20 last:border-0 hover:bg-white/40 transition-colors">
                          <div className="w-14 flex items-center justify-center bg-gray-200 border-r-2 border-gray-400 font-black text-lg text-slate-700">{index + 1}</div>
                          
                          {/* 🔒 VOTE COUNT HIDDEN: Only Candidate Name Shown */}
                          <div className="flex-1 px-8 flex items-center bg-white border-r-2 border-gray-400">
                            <span className="text-base font-black uppercase text-slate-900 tracking-tight">{c.name}</span>
                          </div>

                          <div className="w-36 flex items-center justify-around bg-gray-100 px-3">
                            <div className={`w-6 h-6 rounded-full border-2 border-black/10 transition-all ${isVoting ? 'bg-red-600 shadow-[0_0_20px_red] animate-pulse' : 'bg-[#4a1010]'}`}></div>
                            <button
                              onClick={() => handleVote(election.id, c.id)}
                              disabled={votingId !== null}
                              className="w-16 h-10 rounded-full shadow-lg transition-all active:scale-90 bg-[#1d4ed8] hover:bg-[#2563eb] shadow-[0_5px_0_#1e3a8a] cursor-pointer"
                            ></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="bg-[#2c3e50] p-5 text-center text-white text-xs font-black uppercase tracking-[0.3em]">{election.title}</div>
                </div>
                <div className="w-6 h-12 bg-gradient-to-b from-gray-700 to-gray-900 mx-auto opacity-50"></div>
                <div className="w-40 h-3 bg-black mx-auto rounded-full blur-sm opacity-20"></div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-black/90 backdrop-blur-xl p-5 text-center border-t border-white/5 z-50">
          <p className="text-[9px] text-gray-400 font-black tracking-[0.5em] uppercase">Electoral Command • Blockchain Integrity 2026</p>
      </footer>
    </div>
  );
}