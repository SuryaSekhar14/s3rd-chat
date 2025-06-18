import React from "react";
import { UserButton } from "@clerk/nextjs";

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
                  gap: "0.5rem",
                },
                userButtonOuterIdentifier: {
                  color: "var(--foreground)",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
