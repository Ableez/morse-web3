"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Heart,
  Share2,
  DollarSign,
  Clock,
  User,
  Download,
  Loader2,
  Edit,
  History,
  ShoppingCart,
  Info,
} from "lucide-react";
import Link from "next/link";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import ContractABI from "../../../../../../utils/transaction/AcademicMarketplace.json";
import { fetchContent } from "../../../../../lib/fetch-nft";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const cardVariants = {
  initial: { scale: 0.95, opacity: 0 },
  in: { scale: 1, opacity: 1 },
};

const NFTDetails = ({ content, isCreator }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();

  const [hasAccess, setHasAccess] = useState(false);
  const [accessDetails, setAccessDetails] = useState(null);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);

  useEffect(() => {
    setHasAccess(content.accesses.length > 0 && content.accesses[0].isActive);
  }, [content.accesses]);

  useEffect(() => {
    const fetchAccessDetails = async () => {
      if (hasAccess) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(
            "0xB82946847Ea8b3AB5061ef6a00622980aD4dF957",
            ContractABI.abi,
            signer
          );

          console.log(contract);
          const accessInfo = await contract.getAccessDetails(content.tokenId);
          setAccessDetails({
            purchaseDate: new Date(
              accessInfo.purchaseTimestamp * 1000
            ).toLocaleString(),
            expirationDate: new Date(
              accessInfo.expirationTimestamp * 1000
            ).toLocaleString(),
            transactionHash: accessInfo.transactionHash,
          });
        } catch (error) {
          console.error("Failed to fetch access details:", error);
          toast({
            title: "Error",
            description: "Failed to fetch access details",
          });
        }
      }
    };

    fetchAccessDetails();
  }, [hasAccess, content.tokenId, toast]);

  const downloadNFT = async () => {
    setDownloadLoading(true);
    try {
      // const response = await fetchContent(content.contentURI);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        "0xB82946847Ea8b3AB5061ef6a00622980aD4dF957",
        ContractABI.abi,
        signer
      );

      const contentURI = await contract.getContentURI(content.tokenId);
      console.log(contentURI);
      const resp = await fetch(
        `https://green-casual-clam-234.mypinata.cloud/ipfs/${contentURI}?pinataGatewayToken=3ACgAZmBURblj56xyGFb-GM1PcG3KJMY0H0RoztDmc4HgFc7sPUQvofKFmS2ID9v`
      );

      if (!resp.ok) {
        throw new Error("Network response was not ok");
      }

      // Get the content type from the response headers

      // Use the Blob API to handle binary data correctly
      const blob = await resp.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Set the file name
      // You might want to get the actual file name from the content metadata if available
      const fileName =
        content.title.replace(/\s+/g, "_") + getFileExtension(".pdf");
      a.download = fileName;

      // Append to the document, trigger the download, and clean up
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Successful",
        description: "Your file has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description:
          "There was an error downloading the file. Please try again.",
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  // Helper function to get file extension based on MIME type
  const getFileExtension = (mimeType) => {
    const extensions = {
      "application/pdf": ".pdf",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "text/plain": ".txt",
      // Add more mappings as needed
    };
    return extensions[mimeType] || "";
  };

  const redactAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const updateListing = () => {
    router.push(`/edit/${content.tokenId}`);
  };

  const viewPurchaseHistory = () => {
    router.push(`/history/${content.tokenId}`);
  };

  const purchaseAccess = async () => {
    setPurchaseLoading(true);
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask to make purchases.");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        "0xB82946847Ea8b3AB5061ef6a00622980aD4dF957",
        ContractABI.abi,
        signer
      );

      const tx = await contract.purchaseContent(content.tokenId, {
        value: ethers.utils.parseEther(content.priceETH.toString()),
      });

      await tx.wait();

      toast({
        title: "Purchase successful!",
        description: "You now have access to this content.",
      });
      router.refresh();
    } catch (error) {
      console.error("Purchase failed:", error);
      toast({ title: "Purchase failed", description: error.message });
    } finally {
      setPurchaseLoading(false);
    }
  };

  const viewAccessDetails = () => {
    setIsAccessDialogOpen(true);
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
      className="min-h-screen md:p-8"
    >
      <div className="max-w-4xl mx-auto bg-neutral-100 dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="md:p-8 p-3">
          <div className="flex justify-between items-center mb-8">
            <Link
              href="/user-page"
              className="text-xs opacity-60 flex align-middle place-items-center justify-start"
            >
              <ArrowLeft size={16} className="inline-block mr-2" />
              Back to Dashboard
            </Link>
            <UserButton />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div variants={cardVariants} transition={{ duration: 0.5 }}>
              <Card className="overflow-hidden">
                <Image
                  width={400}
                  height={400}
                  src={content.coverImage}
                  alt={content.title}
                  className="w-full h-auto object-cover"
                />
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl mb-2">
                        {content.title}
                      </CardTitle>
                      <CardDescription>{content.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="access">Access</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="mt-4">
                      <dl className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm text-neutral-500">Creator</dt>
                          <dd className="font-medium">
                            {content.creator.username}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-neutral-500">
                            Creator Address
                          </dt>
                          <dd className="font-medium">
                            {redactAddress(content.creatorAddress)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-neutral-500">
                            Price (USD)
                          </dt>
                          <dd className="font-medium">${content.priceUSD}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-neutral-500">
                            Price (ETH)
                          </dt>
                          <dd className="font-medium">
                            {content.priceETH} ETH
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-neutral-500">Token ID</dt>
                          <dd className="font-medium">{content.tokenId}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-neutral-500">Created</dt>
                          <dd className="font-medium">
                            {new Date(content.createdAt).toLocaleDateString()}
                          </dd>
                        </div>
                      </dl>
                    </TabsContent>
                    <TabsContent value="access" className="mt-4">
                      <div className="space-y-4">
                        {content.accesses.map((access) => (
                          <Badge
                            key={access.id}
                            variant="outline"
                            className="justify-between text-base py-2 w-full"
                          >
                            <span>Access expires:</span>
                            <span className="font-semibold">
                              {new Date(access.expiresAt).toLocaleDateString()}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter>
                  {isCreator ? (
                    <div className="w-full space-y-4">
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={updateListing}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Update Listing
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={viewPurchaseHistory}
                      >
                        <History className="mr-2 h-4 w-4" /> View Purchase
                        History
                      </Button>
                    </div>
                  ) : hasAccess ? (
                    <div className="w-full space-y-4">
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={downloadNFT}
                        disabled={downloadLoading}
                      >
                        {downloadLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {downloadLoading
                          ? "Downloading..."
                          : "Download Content"}
                      </Button>
                      <Dialog
                        open={isAccessDialogOpen}
                        onOpenChange={setIsAccessDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                            onClick={viewAccessDetails}
                          >
                            <Info className="mr-2 h-4 w-4" /> View Access
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Access Details</DialogTitle>
                            <DialogDescription>
                              {hasAccess ? (
                                accessDetails ? (
                                  <div className="space-y-2">
                                    <p>
                                      <strong>Purchase Date:</strong>{" "}
                                      {accessDetails.purchaseDate}
                                    </p>
                                    <p>
                                      <strong>Expiration Date:</strong>{" "}
                                      {accessDetails.expirationDate}
                                    </p>
                                    <p>
                                      <strong>Transaction Hash:</strong>{" "}
                                      {accessDetails.transactionHash}
                                    </p>
                                  </div>
                                ) : (
                                  <p>Loading access details...</p>
                                )
                              ) : (
                                <p>
                                  You do not have access to this content yet.
                                  Purchase to gain access.
                                </p>
                              )}
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={purchaseAccess}
                        disabled={purchaseLoading}
                      >
                        {purchaseLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="mr-2 h-4 w-4" />
                        )}
                        {purchaseLoading ? "Processing..." : "Purchase Access"}
                      </Button>
                      <Dialog
                        open={isAccessDialogOpen}
                        onOpenChange={setIsAccessDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                            onClick={viewAccessDetails}
                          >
                            <Info className="mr-2 h-4 w-4" /> View Access
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Access Details</DialogTitle>
                            <DialogDescription>
                              {hasAccess ? (
                                accessDetails ? (
                                  <div className="space-y-2">
                                    <p>
                                      <strong>Purchase Date:</strong>{" "}
                                      {accessDetails.purchaseDate}
                                    </p>
                                    <p>
                                      <strong>Expiration Date:</strong>{" "}
                                      {accessDetails.expirationDate}
                                    </p>
                                    <p>
                                      <strong>Transaction Hash:</strong>{" "}
                                      {accessDetails.transactionHash}
                                    </p>
                                  </div>
                                ) : (
                                  <p>Loading access details...</p>
                                )
                              ) : (
                                <p>
                                  You do not have access to this content yet.
                                  Purchase to gain access.
                                </p>
                              )}
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </div>

          <motion.div
            variants={cardVariants}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {isCreator ? "Creator Tools" : "Content Access"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCreator ? (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Manage content visibility and access</li>
                    <li>Update content details and pricing</li>
                    <li>View analytics on content performance</li>
                    <li>Communicate with content purchasers</li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Access exclusive content</li>
                    <li>Participate in creator&apos;s community</li>
                    <li>Receive updates on new content releases</li>
                    <li>Manage your access subscription</li>
                  </ul>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  {isCreator ? "Access Creator Dashboard" : "View Full Content"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default NFTDetails;
