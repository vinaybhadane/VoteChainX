# VoteChain-X: Decentralized & Gasless Voting System

**VoteChain-X** is a secure, transparent, and user-centric e-voting platform built on blockchain technology. It eliminates the traditional barriers of digital voting—specifically high gas fees, voter privacy, and double-voting—using Meta-Transactions and Client-Side Cryptographic Hashing.


## 🚀 Key Features

* **Gasless Voting (Meta-Transactions):** Voters can cast their votes without holding any crypto tokens. The Administrative wallet sponsors the gas fees via a secure Relayer API.
* **Privacy-Preserving Identity:** Uses **Keccak-256** hashing for Aadhaar numbers. Plaintext IDs are never transmitted or stored on the ledger, ensuring Zero-Knowledge privacy.
* **Anti-Double Voting:** Implements dual-layer verification (Wallet Address + Identity Hash) to ensure one person, one vote.
* **Live Admin Monitor:** Real-time tracking of voting sessions with the ability to terminate elections securely.
* **Professional E-Receipts:** Generates immutable digital ballot slips with blockchain transaction hashes for voter verification.
* **Responsive UI:** Optimized for both Desktop and Mobile (EVM-style interface).


## 🛠️ Tech Stack

* **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion
* **Blockchain Logic:** Solidity v0.8.24, Ethers.js v6
* **Development:** Hardhat
* **Security:** OpenZeppelin (ECDSA, ReentrancyGuard, Ownable)
* **Middleware:** Next.js API Routes (Server-Side Relayer)

## 🏗️ Technical Architecture

1.  **Identity Layer:** Frontend performs client-side hashing of the Aadhaar number.
2.  **Signature Layer:** Voter signs a digital message (0 Gas cost) to prove intent.
3.  **Relayer Layer:** Backend API receives the signature and broadcasts the transaction using the Admin's funds.
4.  **Contract Layer:** The Smart Contract recovers the signer's identity and commits the vote to the immutable ledger.

## ⚙️ Local Setup Instructions

### 1. Prerequisites
* Node.js (v18 or higher)
* MetaMask Browser Extension

### 2. Installation
```bash
git clone https://github.com/vinaybhadane/VoteChainX.git
cd VoteChainX
npm install
```

### 3. Start Local Blockchain
Open a separate terminal:
```bash
npx hardhat node
```

### 4. Deploy Smart Contract
Open another terminal:
```bash
npx hardhat run scripts/deploy.cjs --network localhost
```
*Note: Copy the deployed contract address and update it in `src/constants/index.ts`.*

### 5. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to access the portal.

---

## 🛡️ Security Measures

* **Reentrancy Guard:** Protection against recursive call attacks.
* **Access Control:** Administrative functions restricted to authorized "Double Admin" addresses.
* **ECDSA Verification:** On-chain cryptographic recovery of voter signatures.
* **Input Masking:** Live vote counts are hidden from the user dashboard to prevent selection bias during active elections.

---

## 📖 Important Notes for Judges

* **Local Testing:** This project is designed to run on the Hardhat Local Network.
* **MetaMask Reset:** If you encounter a "Nonce" error, go to MetaMask > Settings > Advanced > Clear activity tab data.
* **Admin Access:** The default Admin is Hardhat Account #0 (`0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`).

---

## 👥 Team
* **Vinay Bhadane**
* **Sakshi Patil**
* **Mrunmayi Prayage**

