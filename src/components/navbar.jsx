"use client";
import React, { useEffect } from "react";
import { Button } from "./ui/button";
import {
  CalendarIcon,
  DoorOpen,
  EllipsisVertical,
  PersonStandingIcon,
  Upload,
  User,
} from "lucide-react";
import ConnectWallet from "./connect-wallet";
import Image from "next/image";
import Link from "next/link";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";
import {
  EnvelopeClosedIcon,
  FaceIcon,
  GearIcon,
  RocketIcon,
} from "@radix-ui/react-icons";
import {
  SignedIn,
  SignedOut,
  SignInWithMetamaskButton,
  SignOutButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "./ui/drawer";
import SearchBar from "./search-bar";

const Navbar = () => {
  const [open, setOpen] = React.useState(false);
  const { user } = useUser();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  return (
    <div className={"w-full z-50 dark:bg-neutral-950 sticky top-0 "}>
      <div
        className={
          "flex justify-between place-items-center gap-2 align-middle p-2 max-w-screen-lg mx-auto"
        }
      >
        <UserButton />

        <SearchBar />

        <SignedOut>
          <SignInWithMetamaskButton mode="modal">
            <div
              className={
                "align-middle place-items-center gap-1 p-2 hidden md:flex"
              }
            >
              <Image
                alt={"Login"}
                width={24}
                height={24}
                src={"/metamask.svg"}
              />
              <span className={"hidden md:flex font-bold"}>Login</span>
            </div>
          </SignInWithMetamaskButton>
        </SignedOut>

        <SignedIn>
          <div className={"hidden md:flex"}>
            <ConnectWallet />
          </div>
        </SignedIn>

        <SignedIn>
          <Button className={"hidden md:flex"}>
            <Link href={"/upload"}>Upload content</Link>
          </Button>
        </SignedIn>
        <Drawer>
          <DrawerTrigger asChild>
            <Button size={"icon"} variant={"outline"}>
              <EllipsisVertical size={18} />
            </Button>
          </DrawerTrigger>
          <DrawerContent className={"max-w-screen-sm mx-auto"}>
            <div className={"px-2 py-8"}>
              {/* <SignedIn asChild>
                <div className={"md:hidden flex w-full"}>
                  <ConnectWallet />
                </div>
              </SignedIn> */}

              <SignedIn>
                <div className={"flex flex-col gap-1 w-full"}>
                  <DrawerClose asChild>
                    <Link href={"/upload"} className={""}>
                      <Button
                        className={
                          "md:hidden flex w-full justify-start align-middle place-items-center gap-3 bg-blue-600/10"
                        }
                        variant={"ghost"}
                      >
                        <Upload size={16} />
                        Upload content
                      </Button>
                    </Link>
                  </DrawerClose>
                  <DrawerClose asChild>
                    <Link href={"/profile"}>
                      <Button
                        className={
                          "md:hidden flex w-full justify-start align-middle place-items-center gap-3"
                        }
                        variant={"ghost"}
                      >
                        <User size={16} />
                        My Contents
                      </Button>
                    </Link>
                  </DrawerClose>

                  <SignedIn>
                    <DrawerClose asChild>
                      <Link href={"/profile"}>
                        <Button
                          className={
                            " w-full justify-start align-middle place-items-center gap-3 md:flex hidden"
                          }
                          variant={"ghost"}
                        >
                          <User size={16} />
                          My Contents
                        </Button>
                      </Link>
                    </DrawerClose>
                  </SignedIn>

                  <div className={"h-px w-full bg-neutral-700"} />
                  <DrawerClose asChild>
                    <SignOutButton className={"mt-4 w-full justify-start"}>
                      <Button
                        className={
                          "md:hidden flex w-full justify-start align-middle place-items-center gap-2.5 bg-red-600/20 text-red-600"
                        }
                        variant={"ghost"}
                      >
                        <DoorOpen size={16} className={"text-red-100 mr-3"} />
                        Signout
                      </Button>
                    </SignOutButton>
                  </DrawerClose>
                </div>
              </SignedIn>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export default Navbar;
