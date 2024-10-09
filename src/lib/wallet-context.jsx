"use client";

import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";

export const WalletContext = React.createContext({
  wallet: {},
  account: null,
  connectWallet: () => {},
  isConnected: false,
});

const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState({});
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (window && window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        setWallet({ provider, signer, address });
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        console.log("ACCOUNT CHANGED");
        setAccount(accounts[0] || null);
      });
    }
  }, []);

  useEffect(() => {
    const cn = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const acct = await window.ethereum.request({
            method: "eth_requestAccounts",
          });

          console.log("ACCOUNT", acct);
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);
          setWallet({ provider, signer, address });
          setIsConnected(true);
        } catch (err) {
          console.error(err);
          if (err.message === "User rejected request") {
            console.log("USER REJECTED");
            // TODO: Add a toast
          }
          if (err.code === 4001) {
            console.log("Please connect to MetaMask.");
            // TODO: Add a toast
          }
        }
      }
    };

    void cn();
  }, []);

  useEffect(() => {
    const rn = () => {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        provider.on("connect", (data) => {
          console.log("CONNECTED", data);
        });

        return () => provider.removeListener("connect")();
      }
    };
  }, []);

  useEffect(() => {
    if (account) {
      connectWallet();
    }
  }, [account]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        account,
        connectWallet,
        isConnected,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
