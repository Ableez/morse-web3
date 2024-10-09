import React from "react";
import { getNFTDetails } from "@/lib/fetch-nft";
import NFTContentViewer from "./_components/nft-detail";
import { Loader2 } from "lucide-react";

const ViewContent = async (props) => {
  const { params } = props;
  const detail = await getNFTDetails(params.id);

  if (!detail) {
    return (
      <div
        className={
          "h-72 w-screen flex align-middle place-items-center justify-center"
        }
      >
        <Loader2 size={36} className={"opacity-60 animate-spin"} />
      </div>
    );
  }

  return <NFTContentViewer content={detail} />;
};

export default ViewContent;
