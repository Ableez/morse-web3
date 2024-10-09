"use client";

import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
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
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  View,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import ContractABI from "../../../../../../utils/transaction/AcademicMarketplace.json";
import { fetchContent } from "../../../../../lib/fetch-nft";
// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

export default function NFTContentViewer({ content }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfData, setPdfData] = useState(null);
  const { toast } = useToast();
  const { user } = useUser();
  const [viewLoading, setViewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const hasAccess = content.accesses.length > 0 && content.accesses[0].isActive;

  const view = async () => {
    setViewLoading(true);
    if (!user?.primaryWeb3Wallet) {
      toast({ title: "Please login and connect your wallet first" });
      setViewLoading(false);
      return;
    }

    if (typeof window.ethereum === "undefined") {
      toast({
        title: "Ethereum provider is not available. Please install MetaMask.",
      });
      setViewLoading(false);
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
        setViewLoading(false);
        return;
      }

      const contract = new ethers.Contract(
        "0xB82946847Ea8b3AB5061ef6a00622980aD4dF957",
        ContractABI.abi,
        signer
      );

      // Fetch content for viewing
      const cid = await contract.getContentURI(content.tokenId);
      const { base64, contentType } = await fetchContent(cid);

      const file = new File([base64], `${content.title}.pdf`, {
        type: contentType,
      });
      console.log("FILE: ", file);
      setPdfData(file);
      toast({ title: "Content loaded successfully" });
    } catch (err) {
      console.error("Error while viewing content:", err);
      toast({ title: "Error viewing content", description: err.message });
    } finally {
      setViewLoading(false);
    }
  };

  const downloadPDF = () => {
    if (pdfData) {
      setDownloadLoading(true);
      try {
        const link = document.createElement("a");
        link.href = pdfData;
        link.download = `${content.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "File downloaded successfully" });
      } catch (error) {
        console.error("Error downloading the PDF:", error);
        toast({
          title: "Error downloading the file",
          description: error.message,
        });
      } finally {
        setDownloadLoading(false);
      }
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
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <TabsContent value="preview">
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    {pdfData ? (
                      <Document
                        file={pdfData}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className="mx-auto"
                      >
                        <Page pageNumber={pageNumber} width={450} />
                      </Document>
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <p>Content not available or still loading...</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setPageNumber((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={pageNumber <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {pageNumber} of {numPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setPageNumber((prev) =>
                          Math.min(prev + 1, numPages || 1)
                        )
                      }
                      disabled={pageNumber >= (numPages || 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
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
                  <>
                    <Button
                      variant="outline"
                      className="w-full gap-2 justify-start"
                      onClick={() => view()}
                      disabled={viewLoading}
                    >
                      {viewLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <View className="mr-2 h-4 w-4 text-emerald-600" />
                      )}
                      {viewLoading ? "Loading..." : "View"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => downloadPDF()}
                      disabled={downloadLoading || !pdfData}
                    >
                      {downloadLoading ? (
                        <Loader2 size={16} className="animate-spin mr-2" />
                      ) : (
                        <Download className="mr-2 h-4 w-4 text-rose-600" />
                      )}
                      {downloadLoading ? "Downloading..." : "Download"}
                    </Button>
                  </>
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
