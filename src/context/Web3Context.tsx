"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { ethers } from "ethers";

const Web3Context = createContext<any>(null);

// 🔥 LOCALHOST CONFIGURATION: Hardhat default settings
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x7a69", // 31337 in Hex (Hardhat's default Chain ID)
  rpcTarget: "http://127.0.0.1:8545", // Local Node URL
  displayName: "Hardhat Localhost",
  blockExplorerUrl: "https://localhost:8545", // No explorer for local
  ticker: "ETH",
  tickerName: "ETH",
};

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Helper: Automatic Network Switcher (Localhost Version) ---
  const ensureCorrectNetwork = async (targetProvider: any) => {
    try {
      await targetProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainConfig.chainId }],
      });
    } catch (switchError: any) {
      // Error code 4902 means the local network isn't added to MetaMask yet
      if (switchError.code === 4902) {
        try {
          await targetProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainConfig.chainId,
                chainName: chainConfig.displayName,
                rpcUrls: [chainConfig.rpcTarget],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add local network:", addError);
        }
      }
      console.error("Failed to switch to localhost:", switchError);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
        const web3authInstance = new Web3Auth({
          clientId: "BA-IV39VJ3Hdd9ShKiPcBsmNIBI-79yGtYbHokTte5nq4bG8A1fVIij-5We61S5sPxzjA5poBxsDD0xI38sVdno",
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider,
        });

        await web3authInstance.initModal();
        setWeb3auth(web3authInstance);

        if (web3authInstance.connected && web3authInstance.provider) {
          setProvider(web3authInstance.provider);
          const ethersProvider = new ethers.BrowserProvider(web3authInstance.provider);
          const accounts = await ethersProvider.listAccounts();
          if (accounts.length > 0) setAddress(accounts[0].address);
        } 
        else if (typeof window !== "undefined" && (window as any).ethereum) {
          const eth = (window as any).ethereum;
          const accounts = await eth.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            // Localhost check for existing sessions
            await ensureCorrectNetwork(eth);
            setProvider(eth);
            setAddress(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Web3Auth Init Error:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async () => {
    if (!web3auth) return;
    try {
      const web3authProvider = await web3auth.connect();
      if (web3authProvider) {
        setProvider(web3authProvider);
        const ethersProvider = new ethers.BrowserProvider(web3authProvider);
        const signer = await ethersProvider.getSigner();
        setAddress(await signer.getAddress());
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const loginWithMetaMask = async () => {
    const { ethereum } = window as any;
    if (typeof ethereum !== "undefined") {
      try {
        // 🔥 Switch to Hardhat Localhost before connecting
        await ensureCorrectNetwork(ethereum);
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        setProvider(ethereum);
        setAddress(accounts[0]);
        return accounts[0];
      } catch (error) {
        console.error("MetaMask Error:", error);
      }
    } else {
      alert("Please install MetaMask extension!");
    }
  };

  const logout = async () => {
    if (web3auth?.connected) {
      await web3auth.logout();
    }
    setProvider(null);
    setAddress(null);
  };

  return (
    <Web3Context.Provider value={{ login, loginWithMetaMask, logout, address, loading, provider }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);