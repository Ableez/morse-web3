import { ethers } from "ethers";
import AcademicMarketplaceABI from "./transaction/AcademicMarketplace.json";
import { env } from "@/env";

const contractAddress = env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export const getContract = (signer) => {
  return new ethers.Contract(
    contractAddress,
    AcademicMarketplaceABI.abi,
    signer
  );
};

export const createContent = async (signer, price, duration, contentURI) => {
  const contract = getContract(signer);

  const tx = await contract.createContent?.(
    ethers.parseEther(price),
    duration,
    contentURI
  );

  await tx.wait();
  return tx;
};

export const purchaseAccess = async (signer, contentId, price) => {
  const contract = getContract(signer);
  const tx = await contract.purchaseAccess?.(contentId, {
    value: ethers.parseEther(price),
  });

  await tx.wait();
  return tx;
};
