import { ethers } from "ethers";
import { NextResponse } from "next/server";
import { CONTRACT_ADDRESS, ABI } from "@/constants";

export async function POST(req: Request) {
  try {
    // 1. Frontend se data receive karo
    const body = await req.json();
    const { electionId, candidateId, voter, signature, hashedId } = body;

    // Validation: Check if all data exists
    if (!electionId || !candidateId || !voter || !signature || !hashedId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // 2. Hardhat Local Provider se connect karo
    // Note: Production mein yahan Alchemy/Infura ki URL aayegi
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // 3. Admin Wallet Setup (Hardhat Account #0 ki Private Key)
    // ⚠️ WARNING: Real project mein ise .env file mein rakhein
    const adminPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);

    // 4. Contract Instance (Admin ke wallet ke saath connect kiya taaki Admin gas bhare)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, adminWallet);

    console.log(`Relaying gasless vote for voter: ${voter}...`);

    // 5. Blockchain par transaction bhejo (Calling voteWithSignature)
    // Admin (msg.sender) fees bharega, lekin contract user (voter) ka vote register karega
    const tx = await contract.voteWithSignature(
      electionId,
      candidateId,
      voter,
      signature,
      hashedId
    );

    // 6. Transaction mine hone ka wait karo
    const receipt = await tx.wait();

    console.log(`Transaction Successful! Hash: ${receipt.hash}`);

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      message: "Vote casted successfully (Gas paid by Admin)"
    });

  } catch (error: any) {
    console.error("❌ Relayer Error:", error);

    // Detail error message provide karo debugging ke liye
    return NextResponse.json(
      { 
        success: false, 
        error: error.reason || error.message || "Unknown Blockchain Error" 
      },
      { status: 500 }
    );
  }
}