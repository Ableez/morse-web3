"use client";

import {
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  DollarSign,
  Coins,
  Loader2,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  SignInWithMetamaskButton,
  useUser,
} from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import ContractABI from "../../utils/transaction/MorseAcademy.json";
import { ethers } from "ethers";
import { BASE_URL } from "../../utils/base-url";

const getContentTypeIcon = (contentType) => {
  switch (contentType) {
    case "image":
      return <ImageIcon className="w-5 text-red-500 h-5" />;
    case "video":
      return <Video className="w-5 text-indigo-500 h-5" />;
    case "audio":
      return <Music className="w-5 text-emerald-500 h-5" />;
    case "text":
      return <FileText className="w-5 text-yellow-500 h-5" />;
    default:
      return <FileText className="w-5 text-orange-500 h-5" />;
  }
};

export default function NFTDisplay(props) {
  const { nfts } = props;
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const [ethPrice, setEthPrice] = useState(0);
  const [contract, setContract] = useState(null);

  const fetchEthPrice = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );

      const data = await response.json();
      setEthPrice(data.ethereum.usd);
    } catch (error) {
      console.error("Failed to fetch ETH price:", error);
      toast({ title: "Failed to fetch ETH price. Please try again later." });
    }
  }, [toast]);

  useEffect(() => {
    fetchEthPrice();
    initializeContract();
  }, [fetchEthPrice]);

  const initializeContract = async () => {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(
        "0xB82946847Ea8b3AB5061ef6a00622980aD4dF957",
        ContractABI.abi,
        signer
      );
      setContract(contractInstance);
    }
  };

  const switchToArbitrumSepolia = async (provider) => {
    try {
      console.log("Attempting to switch to Arbitrum Sepolia...");
      await provider.send("wallet_switchEthereumChain", [
        { chainId: "0x66eee" },
      ]);
      console.log("Successfully switched to Arbitrum Sepolia");
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        console.log(
          "Arbitrum Sepolia not found, attempting to add the network..."
        );
        try {
          await provider.send("wallet_addEthereumChain", [
            {
              chainId: "0x66eee",
              chainName: "Arbitrum Sepolia",
              nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
              blockExplorerUrls: ["https://sepolia.arbiscan.io"],
            },
          ]);
          console.log("Arbitrum Sepolia network added successfully");
        } catch (addError) {
          console.error("Failed to add Arbitrum Sepolia network:", addError);
          throw new Error("Failed to add Arbitrum Sepolia network");
        }
      } else {
        console.error("Failed to switch to Arbitrum Sepolia:", switchError);
        throw switchError;
      }
    }
  };

  const buy = async (nft) => {
    setLoading(true);
    const { dismiss } = toast({
      title: "Purchasing...",
      description: "Please wait while we process your purchase.",
      duration: 1000000000000,
    });

    try {
      if (!contract) {
        toast({ title: "Error", description: "Contract not initialized" });
        return;
      }

      console.log("Requesting Ethereum accounts...");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log("User address:", userAddress);

      // Network check and switch
      const network = await provider.getNetwork();
      if (network.chainId !== 421614) {
        console.log("Switching to Arbitrum Sepolia network...");
        await switchToArbitrumSepolia(provider);
        console.log("Successfully switched to Arbitrum Sepolia");
      }

      const hasAccess = await contract.hasAccess(nft.tokenId, userAddress);
      console.log("USER ACCESS", hasAccess);

      if (hasAccess) {
        toast({
          title: "Already Owned",
          description: "You already have access to this content.",
        });

        await fetch(`${BASE_URL || ""}/api/contents/purchase/${nft.id}`, {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
          mode: "no-cors",
        });

        return;
      }

      console.log("PRICE", nft.priceETH);
      const tx = await contract.purchaseAccess(nft.tokenId, {
        value: ethers.utils.parseEther(nft.priceETH.toString()),
      });

      console.log("Transaction sent:", tx.hash);

      await tx.wait();

      // Update backend to reflect purchase
      const response = await fetch(
        `${BASE_URL || ""}/api/contents/purchase/${nft.id}`,
        {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
          mode: "no-cors",
        }
      );

      if (!response.ok) throw new Error("Failed to update purchase on server");

      toast({
        title: "Purchase Successful",
        description: "You have successfully purchased this NFT!",
      });

      router.push("/view/" + nft.id);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: error.message });
    } finally {
      setLoading(false);
      dismiss();
    }
  };

  if (!nfts) {
    return "No NFTs";
  }
  return (
    <div className="container mx-auto max-w-screen-lg p-4">
      <h1 className="text-3xl font-bold mb-6">Morse</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {nfts?.map((nft) => {
          const isOwned = user
            ? nft.accesses.find((n) => n.userId === user.id)
            : false;

          return (
            <Card key={nft.id} className="overflow-hidden grid">
              <div className="relative aspect-video">
                <Image
                  src={nft.coverImage || "/placeholder.svg"}
                  alt={nft.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover rounded-t-lg"
                />
                <div className="absolute top-2 right-2 bg-background/60 rounded-full p-1">
                  {getContentTypeIcon(nft.contentType)}
                </div>

                {isOwned && (
                  <div className="absolute top-2 left-2 bg-blue-500 rounded-full py-1 px-2 text-xs font-bold">
                    Owned
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2
                    className="text-base font-semibold line-clamp-1"
                    title={nft.title}
                  >
                    {nft.title}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {nft.description}
                </p>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">{nft.priceUSD}</span>
                  </div>
                  <div className="flex items-center space-x-1 scale-75">
                    <Coins className="w-4 h-4" />
                    <span className="font-semibold">
                      {parseFloat(nft.priceETH)} ETH
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <SignedIn>
                  <div
                    className={
                      "w-full flex align-middle place-items-center justify-center gap-2"
                    }
                  >
                    {isOwned ? (
                      <Button
                        disabled={loading}
                        className="w-full dark:bg-blue-500 dark:hover:bg-blue-500/80 dark:text-white"
                        onClick={() => router.push("/view/" + nft.id)}
                      >
                        {loading && (
                          <Loader2 width={14} className={"animate-spin"} />
                        )}
                        View
                      </Button>
                    ) : (
                      <Button
                        disabled={loading}
                        className="w-full"
                        onClick={() => buy(nft)}
                      >
                        {loading && (
                          <Loader2 width={14} className={"animate-spin"} />
                        )}
                        Buy Now
                      </Button>
                    )}
                  </div>
                </SignedIn>

                <SignedOut>
                  <SignInWithMetamaskButton mode="modal">
                    <Button
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                    >
                      <Image
                        width={20}
                        height={20}
                        src="/metamask.svg"
                        alt="Metamask"
                        className="mr-2"
                      />
                      Connect Wallet
                    </Button>
                  </SignInWithMetamaskButton>
                </SignedOut>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
