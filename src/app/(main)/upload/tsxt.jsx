"use client";

import { useState } from "react";
import {
  Upload,
  File,
  Image as ImageIcon,
  Video,
  Music,
  DollarSign,
  Tag,
  Info,
  Loader2,
  FileTextIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast, useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { PinataSDK } from "pinata-web3";
import { ethers } from "ethers";
import ContractABI from "../../../../utils/transaction/AcademicMarketplace.json";
import { useRouter } from "next/navigation";

const initialContentData = {
  title: "",
  description: "",
  file: null,
  contentType: "image",
  price: 0,
  tags: [],
  isRentable: false,
  allowDownloads: true,
  rentDuration: 0,
};

export default function CreatorUpload() {
  const [contentData, setContentData] = useState(initialContentData);
  const [previewUrl, setPreviewUrl] = useState(null);
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setContentData((prev) => ({ ...prev, file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContentTypeChange = (value) => {
    setContentData((prev) => ({ ...prev, contentType: value }));
  };

  const handleRentDurationChange = (value) => {
    setContentData((prev) => ({ ...prev, rentDuration: value }));
  };

  const handlePriceChange = (value) => {
    setContentData((prev) => ({ ...prev, price: value[0] }));
  };

  const handleSwitchChange = (name) => (checked) => {
    setContentData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleTagsChange = (e) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (newTag && !contentData.tags.includes(newTag)) {
        setContentData((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
        e.currentTarget.value = "";
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setContentData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!user.isSignedIn || !user.user.primaryWeb3Wallet) {
      toast("You have to login and connect your wallet first");
      setLoading(false);
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
        setLoading(false);
        return;
      }

      const userAddress = await signer.getAddress();
      const balance = await provider.getBalance(userAddress);
      console.log("USER CURRENT BALANCE", ethers.utils.formatEther(balance));
      console.log("CODE ", await provider.getCode(userAddress));

      // Check if the user has enough balance
      const gasLimit = 500000; // Estimate this later!!!!
      const gasPrice = await provider.getGasPrice();
      const estimatedGasCost = gasPrice.mul(gasLimit);
      const requiredBalance = ethers.utils
        .parseEther(contentData.price.toString())
        .add(estimatedGasCost);

      if (balance.lt(requiredBalance)) {
        toast({
          description: "Insufficient funds to cover content price and gas fees",
        });
        setLoading(false);
        return;
      }

      const contract = new ethers.Contract(
        "0x809C9cf33B1CE2BF7daaD14ad1CD99C64eb5a179", // REMOVE THIS
        ContractABI.abi,
        signer
      );
      const CONTENT_CREATOR_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("CONTENT_CREATOR_ROLE")
      );

      if (contract.hasRole(CONTENT_CREATOR_ROLE, userAddress)) {
        console.log("ROLE GRANTED");
      } else {
        console.log("GRANTING ROLE TO", userAddress);
        await contract.grantRole(CONTENT_CREATOR_ROLE, userAddress);
      }

      const {
        title,
        description,
        file,
        contentType,
        price,
        tags,
        isRentable,
        rentDuration,
      } = contentData;

      let signedUrl;

      const uploadContent = async () => {
        const data = new FormData();
        data.set("file", file);
        data.set("ownerAddress", await signer.getAddress());
        return await fetch("/api/pinata", {
          method: "POST",
          body: data,
        });
      };

      signedUrl = await uploadContent();

      if (!signedUrl.cid) {
        toast({ title: "Check your internet connection... Retrying" });

        const nw = await uploadContent();
        signedUrl = await nw.json();

        if (!signedUrl.cid) {
          toast({ title: "Error uploading the file to IPFS" });

          return;
        }
      }

      console.log("Sending transaction with params:", {
        price: ethers.utils.parseEther(contentData.price.toString()),
        rentDuration: parseInt(contentData.rentDuration),
        cid: signedUrl.cid,
      });

      const tx = await contract.createContent(
        ethers.utils.parseEther(contentData.price.toString()),
        1000 * 60 * 60 * 24 * 365,
        signedUrl.cid,
        {
          gasLimit: gasLimit,
        }
      );

      // console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      // console.log("Transaction receipt:", receipt);

      const event = receipt.events.find((e) => e.event === "ContentCreated");
      let tokenId = event.args.tokenId.toString();

      if (tokenId) {
        toast({
          title: "Contract created",
          description: "saving to database...",
        });
      }

      const nwct = {
        creatorId: user.user.id,
        title,
        description,
        price: price.toString(),
        rentDuration: rentDuration.toString(),
        contentType,
        nftName: signedUrl.name,
        cid: signedUrl.cid,
        creatorAddress: await signer.getAddress(),
        tags: tags.map((tag) => tag.toString()),
        isRentable,
        tokenId,
      };

      const resp = await fetch(`http://localhost:3030/api/contents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nwct),
      });

      const dbResp = await resp.json();

      if (dbResp.ok) {
        toast({
          title: "Content Uploaded",
          description: "Your content has been successfully uploaded.",
          action: <ToastAction altText="View content">View</ToastAction>,
        });

        router.push("/");
      }
    } catch (error) {
      console.error("Detailed error:", error);
      if (error.error && error.error.data) {
        const decodedError = contract.interface.parseError(error.error.data);
        console.log(`Contract error: ${decodedError.name}`);
      } else {
        console.log(`Error uploading content: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-6 w-6" />;
      case "video":
        return <Video className="h-6 w-6" />;
      case "audio":
        return <Music className="h-6 w-6" />;
      case "text":
        return <File className="h-6 w-6" />;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Upload Content</CardTitle>
          <CardDescription>Share your creations with the world</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">Upload A PDF Article</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept={"application/pdf"}
                />
                {getContentTypeIcon(contentData.contentType)}
              </div>
            </div>

            {previewUrl &&
              (contentData.contentType === "image" ||
                contentData.contentType === "video") && (
                <div className="mt-4 w-full place-items-center justify-center">
                  <FileTextIcon size={52} className="opacity-60" />
                </div>
              )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={contentData.title}
                onChange={handleInputChange}
                placeholder="Enter a title for your content"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={contentData.description}
                onChange={handleInputChange}
                placeholder="Describe your content"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (ETH)</Label>
              <div className="flex items-center space-x-4">
                <Input
                  placeholder={"ETH"}
                  value={contentData.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  type={"number"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {contentData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-secondary-foreground hover:text-primary-foreground"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <Input
                id="tags"
                placeholder="Add tags (press Enter)"
                onKeyDown={handleTagsChange}
              />
            </div>
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
            )}{" "}
            Upload Content
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
