import { Suspense } from "react";
import NFTDisplay from "@/components/content-map";
import { getNFTs } from "@/lib/fetch-nft";

export default async function Home() {
  return (
    <Suspense fallback={<LoadingNFTs />}>
      <NFTList />
    </Suspense>
  );
}

async function NFTList() {
  const nfts = await getNFTs();

  if (!nfts || nfts.length === 0) {
    return (
      <div className="w-screen h-[400px] flex justify-center items-center font-bold opacity-50">
        We have no NFTs to show
      </div>
    );
  }

  return <NFTDisplay nfts={nfts} />;
}

function LoadingNFTs() {
  return (
    <div className="w-screen h-[400px] flex justify-center items-center font-bold opacity-50">
      Loading NFTs...
    </div>
  );
}
