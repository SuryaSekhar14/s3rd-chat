"use client";

import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePillProps {
  imageUrl: string;
  fileName?: string;
  onRemove: () => void;
  disabled?: boolean;
}

export function ImagePill({
  imageUrl,
  fileName,
  onRemove,
  disabled,
}: ImagePillProps) {
  const displayName =
    fileName || imageUrl.split("/").pop()?.split("?")[0] || "image";
  const truncatedName =
    displayName.length > 20
      ? displayName.substring(0, 17) + "..."
      : displayName;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm max-w-xs">
      <div className="relative w-6 h-6 rounded-full overflow-hidden border border-blue-300">
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <span className="text-blue-700 font-medium truncate flex-1 min-w-0">
        {truncatedName}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={disabled}
        className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full flex-shrink-0"
        title="Remove image"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
