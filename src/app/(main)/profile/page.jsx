"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Loader2, BadgeCheck, BadgeX, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { UserButton, useUser } from "@clerk/nextjs";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";

export default function UserProfile() {
  const { user } = useUser();
  const [currentWalletBalance, setCurrentWalletBalance] = useState({
    eth: 0,
    usd: 0,
  });
  const [ethPrice, setEthPrice] = useState(0);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  const walletBalance = useCallback(async () => {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    console.log("User address:", userAddress);
    const balance = await provider.getBalance(userAddress);
    const parsedBalance = ethers.utils.formatEther(balance);

    setCurrentWalletBalance({
      eth: parsedBalance,
      usd: parsedBalance * ethPrice,
    });
  }, [ethPrice]);

  useEffect(() => {
    void walletBalance();
  }, [walletBalance]);

  const fetchUserContents = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${
          process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : process.env.BASE_URL
        }/api/contents/get-user-nfts/${user.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user contents");
      }
      const data = await response.json();

      console.log("DATA", data);
      setContents(data.nfts);
    } catch (error) {
      console.error("Error fetching user contents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your contents. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchUserContents();
  }, [fetchUserContents]);

  if (!user) {
    return (
      <div className="h-72 w-screen flex align-middle place-items-center justify-center gap-2">
        <Loader2 size={16} className="opacity-60 animate-spin" />
        <h4 className="text-xs font-medium">Please wait...</h4>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-72 w-screen flex align-middle place-items-center justify-center gap-2">
        <Loader2 size={16} className="opacity-60 animate-spin" />
        <h4 className="text-xs font-medium">Fetching your contents...</h4>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-1">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">User Profile</CardTitle>
          <UserButton />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={user.imageUrl} alt={user.username} />
                <AvatarFallback>{user.username[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p>{user.emailAddresses[0].emailAddress}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Wallet Balance
                    </Label>
                    <div className="flex items-center gap-4">
                      <p className="flex items-center">
                        <span className="text-xs font-bold mr-1.5">ETH</span>
                        {currentWalletBalance.eth}
                      </p>
                      <p className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-0.5" />
                        {currentWalletBalance.usd.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex align-middle place-items-center gap-2 w-full">
                    <p>
                      {user.emailAddresses[0].verification.status ===
                      "verified" ? (
                        <BadgeCheck size={16} className="text-green-500" />
                      ) : (
                        <BadgeX size={16} className="text-red-500" />
                      )}
                    </p>
                    <h4 className="text-sm font-medium">Verified</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="nfts" className="max-w-4xl mx-auto mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nfts">My NFTs</TabsTrigger>
        </TabsList>
        <TabsContent value="nfts">
          <Card>
            <CardHeader>
              <CardTitle>My NFTs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {contents.length === 0 ? (
                  <div className="col-span-full text-center py-10">
                    <h2 className="text-2xl font-bold mb-2">No NFTs Found</h2>
                    <p>You haven&apos;t minted or purchased any NFTs yet.</p>
                  </div>
                ) : (
                  contents.map((nft) => (
                    <Card key={nft.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="aspect-square relative mb-2">
                          <Image
                            src={nft.coverImage || "/placeholder.svg"}
                            layout="fill"
                            objectFit="cover"
                            alt={nft.title}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="flex align-middle place-items-center pb-2 justify-between">
                          <h3 className="font-semibold truncate">
                            {nft.title}
                          </h3>

                          {nft.accesses.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Users2 size={12} className="text-blue-600" />
                              <p className="text-xs text-blue-600 font-semibold">
                                {nft.accesses.length}
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {nft.description}
                        </p>

                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-medium">
                            {parseFloat(nft.priceETH).toFixed(4)} ETH
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ${parseFloat(nft.priceUSD).toFixed(2)}
                          </span>
                        </div>

                        <p
                          className="text-[10px] font-semibold p-1 px-2 bg-background/10 w-fit
                         rounded-full text-blue-300 dark:bg-white/10 text-muted-foreground truncate mt-2"
                        >
                          {new Date(nft.createdAt).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
