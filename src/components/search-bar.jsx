"use client";

import React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./ui/command";
import { User2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "./ui/input";

const SearchBar = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((value) => {
    const params = new URLSearchParams(searchParams);
    console.log("SEARCH TERM...", value);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    replace(`${pathname}?${params.toString()}`);
  }, 200);

  return (
    <Input
      onChange={(e) => handleSearch(e.target.value)}
      default={searchParams.get("search") || ""}
      placeholder="CMD K Type a command or search..."
    />
  );
};

export default SearchBar;
