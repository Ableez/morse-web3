"use client";
import React from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

const ConnectWallet = () => {
  const { user } = useUser();
  return (
    <div>
      <div
        className={`border dark:border-neutral-800 py-2 pr-8 px-4 rounded-md flex align-middle place-items-center gap-1`}
      >
        <Image width={15} height={15} src="/metamask.svg" alt="Metamask" />
        {user?.primaryWeb3Wallet ? (
          <div className={"flex align-middle place-items-center gap-2"}>
            <div
              className={"bg-green-600 h-2 w-2 aspect-square rounded-full"}
            />
            <h4 className={"text-xs"}>Connected</h4>
          </div>
        ) : (
          <div className={"flex align-middle place-items-center gap-2"}>
            <div className={"bg-red-600 h-2 w-2 aspect-square rounded-full"} />
            <h4 className={"text-xs"}>Connect</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectWallet;
