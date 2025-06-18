"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SignOutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-xl font-semibold mb-4 text-center text-gray-900 dark:text-white">
          Sign out from S3RD Chat
        </h1>
        <div className="flex flex-col gap-4">
          <SignOutButton>
            <Button className="w-full">Sign Out</Button>
          </SignOutButton>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
