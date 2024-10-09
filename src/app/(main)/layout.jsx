"use client";
import Navbar from "@/components/navbar";
import { SignIn, useUser } from "@clerk/nextjs";
import React from "react";

const Layout = ({ children }) => {
  // const { user } = useUser();

  // if (!user) {
  //   return (
  //     <div className={"flex align-middle justify-center place-items-center gap-2 w-screen h-screen"}>
  //       <SignIn />
  //     </div>
  //   );
  // }

  return (
    <div className={""}>
      <Navbar />
      {children}
    </div>
  );
};

export default Layout;
