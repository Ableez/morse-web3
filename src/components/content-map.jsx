"use client";

import {
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  DollarSign,
  Coins,
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
import ContractABI from "../../utils/transaction/AcademicMarketplace.json";
import { ethers } from "ethers";

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

  const [ethPrice, setEthPrice] = useState(0);

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
  }, [fetchEthPrice]);

  const rent = async (nft) => {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const network = await provider.getNetwork();
      if (network.chainId !== 421614) {
        toast({
          title: "Please connect your wallet to Arbitrum Sepolia testnet",
        });
        return;
      }

      const contract = new ethers.Contract(
        "0x809C9cf33B1CE2BF7daaD14ad1CD99C64eb5a179",
        ContractABI.abi,
        signer
      );

      console.log("CONTRACT", contract);

      const hasAccess = await contract.hasAccess(
        nft.tokenId,
        await signer.getAddress()
      );

      console.log("USER ACCESS", hasAccess);

      if (hasAccess) {
        toast({
          title: "Accessed",
          description: "Rent it now to get access to it!",
        });
        return;
      }

      console.log("PRICE", nft.price);
      const tx = await contract.purchaseAccess(nft.tokenId, {
        value: ethers.utils.parseEther(nft.price.toString()),
      });

      console.log("Transaction sent:", tx.hash);

      await tx.wait();

      // Update backend to reflect purchase
      const response = await fetch(
        `http://localhost:3030/api/${nft.id}/purchase`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (!response.ok) throw new Error("Failed to update purchase on server");

      toast({
        title: "Purchase Successful",
        description: "You have successfully purchased this NFT!",
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: error.message });
    }
  };

  return (
    <div className="container mx-auto max-w-screen-lg p-4">
      <h1 className="text-3xl font-bold mb-6">NFT Marketplace</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {nfts.map((nft) => {
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
                  <Badge
                    variant={nft.isRentable ? "default" : "secondary"}
                    className="scale-75"
                  >
                    {nft.isRentable ? "Rentable" : "Not Rentable"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {nft.description}
                </p>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">
                      {parseInt(parseFloat(nft.priceETH) * ethPrice).toFixed(2)}{" "}
                      USD
                    </span>
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
                        className="w-full dark:bg-blue-500 dark:hover:bg-blue-500/80 dark:text-white"
                        onClick={() => router.push("/view/" + nft.id)}
                      >
                        View
                      </Button>
                    ) : (
                      <div
                        className={
                          "flex align-middle place-items-center justify-between gap-2"
                        }
                      >
                        {nft.isRentable && (
                          <Button
                            className="w-full"
                            onClick={() => nft.isRentable && rent(nft)}
                          >
                            Rent Now
                          </Button>
                        )}
                        <Button
                          className="w-full"
                          // onClick={() => nft.isRentable && rent(nft)}
                        >
                          Buy Now
                        </Button>
                      </div>
                    )}
                  </div>
                </SignedIn>

                <SignedOut>
                  <SignInWithMetamaskButton mode="modal">
                    <Button variant="outline" className="w-full">
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
