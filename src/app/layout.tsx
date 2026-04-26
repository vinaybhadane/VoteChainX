import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/context/Web3Context";
import AIAssistant from "@/components/AIAssistant"; // AIAssistant import kiya

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoteChain-X | Secure Digital Voting",
  description: "Decentralized voting platform powered by Blockchain & AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        {/* Poore app ko Web3Provider mein wrap kiya hai blockchain calls ke liye */}
        <Web3Provider>
          {children}

          {/* AI Assistant ko yahan add kiya hai taaki ye har page par bottom-right 
            mein floating rahe aur user ko voice guidance de sake.
          */}
          <AIAssistant /> 
        </Web3Provider>
      </body>
    </html>
  );
}