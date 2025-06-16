import React from "react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsIcon } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface UserSectionProps {
  readonly onOpenSettings: () => void;
}

export function UserSection() {
  return (
    <div className="p-4 flex flex-col gap-2 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserButton 
            showName={true} 
            userProfileMode="modal"
            appearance={{
              elements: {
                userButtonBox: {
                  flexDirection: "row-reverse",
                  gap: "0.5rem"
                },
                userButtonOuterIdentifier: {
                  color: "var(--foreground)"
                }
              }
            }}
          />
          {/* <div className="text-sm">
            {user?.fullName ?? "User"}
          </div> */}
        </div>
      </div>
    </div>
  );
} 