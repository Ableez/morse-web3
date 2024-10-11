import { Suspense } from "react";
import NFTDisplay from "@/components/content-map";
import { getNFTs } from "@/lib/get-home-nfts";
import SearchBar from "@/components/search-bar";
import PaginationControl from "@/components/pagination-control";

export default async function Home({ searchParams }) {
  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || "";
  const { nfts, totalPages, currentPage } = await getNFTs(page, 9, search);

  if (!nfts || nfts.length === 0) {
    return (
      <div className="w-screen h-[400px] flex justify-center items-center font-bold opacity-50">
        We have no NFTs to show
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<LoadingNFTs />}>
        <NFTDisplay nfts={nfts} />
        <PaginationControl totalPages={totalPages} currentPage={currentPage} />
      </Suspense>
    </>
  );
}

function LoadingNFTs() {
  return (
    <div className="w-screen h-[400px] flex justify-center items-center font-bold opacity-50">
      Loading NFTs...
    </div>
  );
}
