import { Suspense } from "react";
import NFTDisplay from "@/components/content-map";
import { getNFTs } from "@/lib/get-home-nfts";

export default async function Home() {
  const nfts = await getNFTs();

  if (!nfts || nfts.length === 0) {
    return (
      <div className="w-screen h-[400px] flex justify-center items-center font-bold opacity-50">
        We have no NFTs to show
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingNFTs />}>
      <NFTDisplay nfts={nfts} />;
    </Suspense>
  );
}

function LoadingNFTs() {
  return (
    <div className="w-screen h-[400px] flex justify-center items-center font-bold opacity-50">
      Loading NFTs...
    </div>
  );
}
