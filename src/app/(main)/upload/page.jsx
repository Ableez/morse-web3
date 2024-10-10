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
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/ui/tooltip";
import { ethers } from "ethers";
import ContractABI from "../../../../utils/transaction/MorseAcademy.json";

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
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
        {
          mode: "no-cors",
        }
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
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const gasPrice = await provider.getGasPrice();
        const estimatedGasLimit = 500000; // This is an estimate, adjust as needed
        const estimatedGasFee = gasPrice.mul(estimatedGasLimit);
        setEstimatedGas(ethers.utils.formatEther(estimatedGasFee));
      }
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

    console.log("DB DATA", data);

    const resp = await fetch(
      `${
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : process.env.BASE_URL
      }/api/contents/create`,
      {
        method: "POST",
        body: JSON.stringify(data),
        mode: "no-cors",
      }
    );

    return await resp.json();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Starting content upload process...");

      // Validation checks
      if (
        !contentData.file ||
        contentData.file.length === 0 ||
        !contentData.title ||
        !contentData.description ||
        !contentData.priceUSD ||
        !contentData.priceETH
      ) {
        console.log("Validation failed: Missing required fields");
        toast({ title: "Please fill in all fields" });
        return;
      }

      if (!user.isSignedIn || !user.user.primaryWeb3Wallet) {
        console.log("User not signed in or wallet not connected");
        toast({ title: "Please login and connect your wallet first" });
        return;
      }

      if (typeof window.ethereum === "undefined") {
        console.log("Ethereum provider not available");
        toast({
          title: "Ethereum provider is not available. Please install MetaMask.",
        });
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
      console.log(
        "Current network:",
        network.name,
        "Chain ID:",
        network.chainId
      );
      if (network.chainId !== 421614) {
        console.log(
          "Current network is not Arbitrum Sepolia, attempting to switch..."
        );
        await switchToArbitrumSepolia(provider);
        console.log("Network switch completed");
      }

      console.log("Uploading file to IPFS...");
      const uploadResponse = await uploadToIPFS(contentData.file, userAddress);
      if (!uploadResponse.cid) {
        console.log("IPFS upload failed");
        toast({ title: "Failed to upload file to IPFS" });
        return;
      }
      console.log("File uploaded to IPFS. CID:", uploadResponse.cid);

      // Blockchain interactions
      console.log("Initializing contract interaction...");
      const contract = new ethers.Contract(
        "0xB82946847Ea8b3AB5061ef6a00622980aD4dF957",
        ContractABI.abi,
        signer
      );

      console.log("CONTRACT", contract);

      const code = await provider.getCode(userAddress);
      console.log("CODE", code);

      console.log("Creating content on blockchain...");
      const createContentTx = await contract.createContent(
        ethers.utils.parseEther(contentData.priceETH),
        uploadResponse.cid,
        { gasLimit: 500000 }
      );
      const receipt = await createContentTx.wait();
      const event = receipt.events.find((e) => e.event === "ContentCreated");
      const tokenId = event.args.tokenId.toString();

      console.log("Saving to database...");
      await saveToDatabase({
        creatorId: user.user.id,
        title: contentData.title,
        description: contentData.description,
        priceUSD: contentData.priceUSD,
        priceETH: contentData.priceETH,
        tokenId,
        creatorAddress: userAddress,
      });
      console.log("Saved to database successfully");

      toast({
        title: "Content Uploaded",
        description: "Your article has been successfully uploaded.",
      });

      console.log("Upload process completed successfully");
      router.push("/");
    } catch (error) {
      console.error("Error uploading content:", error);
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
    <div className="container mx-auto p-2">
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
