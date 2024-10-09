"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ethers } from "ethers";
import ContractABI from "../../../utils/transaction/AcademicMarketplace.json";
import { db } from "../../server/db/index";
import { users, contents, contentAccess } from "../../server/db/schema";

const contractABI = ContractABI.abi;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const useWalletStore = create(
  persist(
    (set, get) => ({
      wallet: {},
      account: null,
      isConnected: false,
      contract: null,
      userData: null,

      connectWallet: async () => {
        if (window && window.ethereum) {
          try {
            const acct = await window.ethereum.request({
              method: "eth_requestAccounts",
            });
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const contract = new ethers.Contract(
              contractAddress,
              contractABI,
              signer
            );

            // Check if user exists in the database
            let user = await db.query.users.findFirst({
              where: eq(users.walletAddress, address),
            });

            if (!user) {
              // If user doesn't exist, create a new user
              const newUser = {
                walletAddress: address,
                role: "buyer", // Default role
                username: `user_${address.slice(0, 6)}`, // Generate a default username
                email: "", // You might want to prompt the user for an email later
              };

              const result = await db.insert(users).values(newUser).returning();
              user = result[0];
            }

            set({
              account: address,
              wallet: { provider, signer, address },
              isConnected: true,
              contract: contract,
              userData: user,
            });
          } catch (error) {
            console.error("Failed to connect wallet:", error);
          }
        } else {
          alert("Please install MetaMask!");
        }
      },

      setAccount: (account) => set({ account }),

      createContent: async (
        price,
        duration,
        contentURI,
        title,
        description,
        contentType
      ) => {
        const { contract, account } = get();
        if (!contract) throw new Error("Wallet not connected");
        try {
          const tx = await contract.createContent(price, duration, contentURI);
          const receipt = await tx.wait();
          const event = receipt.events.find(
            (e) => e.event === "ContentCreated"
          );
          const tokenId = event.args.tokenId.toNumber();

          // Sync with database
          await db.insert(contents).values({
            id: tokenId.toString(),
            creatorId: account,
            title,
            description,
            price: price.toString(),
            duration: duration.toString(),
            contentURI,
            contentType,
          });

          return tokenId;
        } catch (error) {
          console.error("Error creating content:", error);
          throw error;
        }
      },

      purchaseAccess: async (tokenId, price) => {
        const { contract, account } = get();
        if (!contract) throw new Error("Wallet not connected");
        try {
          const tx = await contract.purchaseAccess(tokenId, { value: price });
          await tx.wait();

          // Sync with database
          const content = await db.query.contents.findFirst({
            where: eq(contents.id, tokenId.toString()),
          });
          const duration = content.duration ? parseInt(content.duration) : null;
          const expiresAt = duration
            ? new Date(Date.now() + duration * 1000)
            : null;

          await db.insert(contentAccess).values({
            contentId: tokenId.toString(),
            userId: account,
            expiresAt,
          });
        } catch (error) {
          console.error("Error purchasing access:", error);
          throw error;
        }
      },

      hasAccess: async (tokenId, user) => {
        const { contract } = get();
        if (!contract) throw new Error("Wallet not connected");
        try {
          const hasAccessOnChain = await contract.hasAccess(tokenId, user);

          // Check access in database
          const access = await db.query.contentAccess.findFirst({
            where: and(
              eq(contentAccess.contentId, tokenId.toString()),
              eq(contentAccess.userId, user),
              eq(contentAccess.isActive, true),
              or(
                isNull(contentAccess.expiresAt),
                gt(contentAccess.expiresAt, new Date())
              )
            ),
          });

          return hasAccessOnChain && access !== null;
        } catch (error) {
          console.error("Error checking access:", error);
          throw error;
        }
      },

      revokeExpiredAccess: async (tokenId, user) => {
        const { contract } = get();
        if (!contract) throw new Error("Wallet not connected");
        try {
          const tx = await contract.revokeExpiredAccess(tokenId, user);
          await tx.wait();

          // Sync with database
          await db
            .update(contentAccess)
            .set({ isActive: false })
            .where(
              and(
                eq(contentAccess.contentId, tokenId.toString()),
                eq(contentAccess.userId, user),
                lte(contentAccess.expiresAt, new Date())
              )
            );
        } catch (error) {
          console.error("Error revoking access:", error);
          throw error;
        }
      },

      getContentURI: async (tokenId) => {
        const { contract } = get();
        if (!contract) throw new Error("Wallet not connected");
        try {
          const contentURI = await contract.getContentURI(tokenId);

          // Fetch additional info from database
          const content = await db.query.contents.findFirst({
            where: eq(contents.id, tokenId.toString()),
          });

          return { contentURI, ...content };
        } catch (error) {
          console.error("Error getting content URI:", error);
          throw error;
        }
      },

      setAccount: (account) => set({ account }),

      updateUserData: async (updatedData) => {
        const { account, userData } = get();
        if (!account || !userData) throw new Error("Wallet not connected");

        try {
          const result = await db
            .update(users)
            .set(updatedData)
            .where(eq(users.walletAddress, account))
            .returning();

          const updatedUser = result[0];
          set({ userData: updatedUser });
        } catch (error) {
          console.error("Error updating user data:", error);
          throw error;
        }
      },
    }),
    {
      name: "wallet-storage",
      getStorage: () => localStorage,
    }
  )
);

// Effect to handle account changes
if (typeof window !== "undefined" && window.ethereum) {
  window.ethereum.on("accountsChanged", (accounts) => {
    console.log("ACCOUNT CHANGED");
    useWalletStore.getState().setAccount(accounts[0] || null);
  });
}

// Effect to attempt initial connection
(async () => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const acct = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("ACCOUNT", acct);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      useWalletStore.setState({
        account: address,
        wallet: { provider, signer, address },
        isConnected: true,
        contract: contract,
      });
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
})();

// Effect to handle account changes
if (typeof window !== "undefined" && window.ethereum) {
  window.ethereum.on("accountsChanged", async (accounts) => {
    console.log("ACCOUNT CHANGED");
    const walletStore = useWalletStore.getState();
    walletStore.setAccount(accounts[0] || null);
    if (accounts[0]) {
      await walletStore.connectWallet(); // Reconnect to get updated user data
    } else {
      useWalletStore.setState({ userData: null, isConnected: false });
    }
  });
}

// Effect to handle provider connection
if (typeof window !== "undefined" && window.ethereum) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  provider.on("connect", (data) => {
    console.log("CONNECTED", data);
  });
}

export default useWalletStore;
