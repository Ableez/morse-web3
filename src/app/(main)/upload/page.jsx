"use client";
import React, { useCallback, useState, useEffect } from "react";
import { Upload, Loader2, DollarSign, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { ethers } from "ethers";
import ContractABI from "../../../../utils/transaction/AcademicMarketplace.json";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/ui/tooltip";

const CreatorUpload = () => {
  const [contentData, setContentData] = useState({
    title: "",
    description: "",
    file: null,
    priceUSD: "0",
    priceETH: "0",
  });
  const [loading, setLoading] = useState(false);
  const [ethPrice, setEthPrice] = useState(0);
  const [estimatedGas, setEstimatedGas] = useState(null);
  const { toast } = useToast();
  const user = useUser();
  const router = useRouter();

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
    estimateGasFee();
  }, [fetchEthPrice]);

  const estimateGasFee = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const gasPrice = await provider.getGasPrice();
      const estimatedGasLimit = 500000; // This is an estimate, adjust as needed
      const estimatedGasFee = gasPrice.mul(estimatedGasLimit);
      setEstimatedGas(ethers.utils.formatEther(estimatedGasFee));
    } catch (error) {
      console.error("Failed to estimate gas fee:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContentData((prev) => ({ ...prev, [name]: value }));
    if (name === "priceUSD") {
      const priceETH = (parseFloat(value) / ethPrice).toFixed(6);
      setContentData((prev) => ({ ...prev, priceETH }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setContentData((prev) => ({ ...prev, file }));
    }
  };

  // Placeholder functions - implement these according to your API
  const uploadToIPFS = async (file, address) => {
    const { dismiss } = toast({
      title: "Uploading to IPFS...",
      description: "This may take a few minutes.",
      duration: 10000,
    });

    try {
      const data = new FormData();

      data.set("file", file);
      data.set("ownerAddress", address);

      const resp = await fetch("/api/pinata", {
        method: "POST",
        body: data,
      });

      const uploadData = await resp.json();

      console.log("RETURNING", { cid: uploadData.IpfsHash });

      return { cid: uploadData.IpfsHash };
    } catch (err) {
      console.error(err);
    } finally {
      dismiss();
    }
  };

  const saveToDatabase = async (data) => {
    // Implement database save logic

    const resp = await fetch(`http://localhost:3030/api/contents`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await resp.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (
      !contentData.file ||
      contentData.file.length === 0 ||
      !contentData.title ||
      !contentData.description ||
      !contentData.priceUSD ||
      !contentData.priceETH
    ) {
      toast({ title: "Please fill in all fields" });
      setLoading(false);
      return;
    }

    if (!user.isSignedIn || !user.user.primaryWeb3Wallet) {
      toast({ title: "Please login and connect your wallet first" });
      setLoading(false);
      return;
    }

    if (typeof window.ethereum === "undefined") {
      toast({
        title: "Ethereum provider is not available. Please install MetaMask.",
      });
      setLoading(false);
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("ETHEREUM:", window.ethereum);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      console.log("SIGNERS", signer);

      // Check if the network is supported
      const network = await provider.getNetwork();
      console.log("Current network:", network);

      return;

      // const price = await provider.getEtherPrice();
      // console.log("Current price:", price);

      if (network.chainId !== 421614) {
        toast({
          title: "Please connect your wallet to Arbitrum Sepolia testnet",
        });
        setLoading(false);
        return;
      }

      // Ensure the provider is connected to the correct network
      await provider.ready;

      const userAddress = await signer.getAddress();
      // Upload file to IPFS (simplified)
      const uploadResponse = await uploadToIPFS(contentData.file, userAddress);

      console.log("CTR RESP", uploadResponse, "USER ADDRESS", userAddress);

      if (!uploadResponse.cid) {
        toast({ title: "Failed to upload file to IPFS" });
        setLoading(false);
        return;
      }

      // Create content on the blockchain
      const contract = new ethers.Contract(
        "0x809C9scf33B1CE2BF7daaD14ad1CD99C64eb5a179",
        ContractABI.abi,
        signer
      );

      console.log("CTR", contract);

      const duration = 1000 * 60 * 60 * 24 * 365;

      // Fix: Use ethers.utils.id to hash the role name
      const CONTENT_CREATOR_ROLE = ethers.utils.id("CONTENT_CREATOR_ROLE");

      const hasRole = await contract.hasRole(CONTENT_CREATOR_ROLE, userAddress);
      if (!hasRole) {
        // Fix: Pass the hashed role instead of a string
        await contract.grantRole(CONTENT_CREATOR_ROLE, userAddress);
      }

      console.log("tx starts", contract);
      const tx = await contract.createContent(
        ethers.utils.parseEther(contentData.priceETH),
        parseInt(duration), // 1 year in milliseconds
        uploadResponse.cid,
        { gasLimit: 500000 }
      );
      console.log("Transaction initiated:", tx);

      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received:", receipt);

      console.log("Searching for ContentCreated event");
      const event = receipt.events.find((e) => e.event === "ContentCreated");
      console.log("Event found:", event);

      const tokenId = event.args.tokenId.toString();
      console.log("Token ID extracted:", tokenId);

      console.log("tx ends", tokenId, receipt);

      // Save to database
      await saveToDatabase({
        creatorId: user.user.id,
        title: contentData.title,
        description: contentData.description,
        priceUSD: contentData.priceUSD,
        priceETH: contentData.priceETH,
        tokenId,
        creatorAddress: userAddress,
      });

      toast({
        title: "Content Uploaded",
        description: "Your article has been successfully uploaded.",
      });

      router.push("/");
    } catch (error) {
      console.error("Error uploading content:");
      console.error(error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      toast({
        title: "Upload Failed",
        description:
          "There was an error uploading your content. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Upload PDF Article
          </CardTitle>
          <CardDescription>
            Share your academic work with the world
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">Upload PDF</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={contentData.title}
                onChange={handleInputChange}
                placeholder="Enter the title of your article"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Abstract</Label>
              <Textarea
                id="description"
                name="description"
                value={contentData.description}
                onChange={handleInputChange}
                placeholder="Enter the abstract of your article"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceUSD">Price (USD)</Label>
              <div className="relative">
                <DollarSign
                  size={16}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <Input
                  id="priceUSD"
                  name="priceUSD"
                  type="number"
                  value={contentData.priceUSD}
                  onChange={handleInputChange}
                  placeholder="Enter price in USD"
                  className="pl-8"
                  required
                />
              </div>
              {contentData.priceETH !== "0" && (
                <p className="text-sm text-gray-500 mt-1">
                  Equivalent: {contentData.priceETH} ETH
                </p>
              )}
            </div>

            {estimatedGas && (
              <div className="space-y-2">
                <Label>Estimated Gas Fee</Label>
                <Tooltip content="This is an estimate and may vary">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm">{estimatedGas} ETH</p>
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                </Tooltip>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <Button
            disabled={loading}
            type="submit"
            onClick={handleSubmit}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Article
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreatorUpload;
