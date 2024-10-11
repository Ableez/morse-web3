"use client";

import React, { useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { User2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
const SearchBar = () => {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [open, setOpen] = useState(false);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        onValueChange={(value) => {
          searchParams.set("search", value);
        }}
        value={search}
        placeholder="CMD K Type a command or search..."
      />
      <CommandList className={"max-w-screen-sm mx-auto"}>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <User2 className="mr-2 h-4 w-4" />
            <span>My Contents</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default SearchBar;
