"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import ContractABI from "../../../../../../utils/transaction/AcademicMarketplace.json";
import { fetchContent } from "../../../../../lib/fetch-nft";

export default function NFTContentViewer({ content }) {
  const { toast } = useToast();
  const { user } = useUser();
  const [downloadLoading, setDownloadLoading] = useState(false);

  const hasAccess = content.accesses.length > 0 && content.accesses[0].isActive;

  const downloadNFT = async () => {
    setDownloadLoading(true);
    if (!user?.primaryWeb3Wallet) {
      toast({ title: "Please login and connect your wallet first" });
      setDownloadLoading(false);
      return;
    }

    if (typeof window.ethereum === "undefined") {
      toast({
        title: "Ethereum provider is not available. Please install MetaMask.",
      });
      setDownloadLoading(false);
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const network = await provider.getNetwork();

      if (network.chainId !== 421614) {
        toast({
          title: "Please connect your wallet to Arbitrum Sepolia testnet",
        });
        setDownloadLoading(false);
        return;
      }

      const contract = new ethers.Contract(
        "0xB82946847Ea8b3AB5061ef6a00622980aD4dF957",
        ContractABI.abi,
        signer
      );

      // Fetch content for downloading
      const cid = await contract.getContentURI(content.tokenId);
      const { base64, contentType } = await fetchContent(cid);

      // Convert base64 to Blob
      const file = new File([base64], `${content.title}.pdf`, {
        type: contentType,
      });

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${content.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "NFT downloaded successfully" });
    } catch (err) {
      console.error("Error while downloading NFT:", err);
      toast({ title: "Error downloading NFT", description: err.message });
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-xl font-semibold">{content.title}</h4>
              <p className="text-sm mt-1 opacity-70 font-normal">
                {content.description}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="text-lg px-3 py-1 bg-blue-500 scale-75"
            >
              {hasAccess ? "Owned" : "No Access"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="order-2 lg:order-1">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <Card>
                    <CardContent className="space-y-4 pt-6">
                      <p className="text-muted-foreground">
                        {content.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Creator:</span>
                        <span>{content.creator.username}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            <div className="flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">Actions</h3>
                {hasAccess ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={downloadNFT}
                    disabled={downloadLoading}
                  >
                    {downloadLoading ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Download className="mr-2 h-4 w-4 text-rose-600" />
                    )}
                    {downloadLoading ? "Downloading..." : "Download NFT"}
                  </Button>
                ) : (
                  <Button variant="default" className="w-full justify-start">
                    Buy Access for ${parseFloat(content.priceUSD).toFixed(3)} (
                    {parseFloat(content.priceETH).toFixed(6)} ETH)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between mt-8">
          <p className="text-sm text-muted-foreground">
            NFT ID: {content.tokenId} • Created:{" "}
            {new Date(content.createdAt).toLocaleDateString()}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
