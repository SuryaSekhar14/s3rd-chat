"use client";

import React from "react";
import Image from "next/image";
import { X, Image as ImageIcon } from "lucide-react";
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
  // Extract filename from URL if not provided
  const displayName =
    fileName || imageUrl.split("/").pop()?.split("?")[0] || "image";

  // Truncate long filenames
  const truncatedName =
    displayName.length > 20
      ? displayName.substring(0, 17) + "..."
      : displayName;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm max-w-xs">
      {/* Thumbnail */}
      <div className="relative w-6 h-6">
        <Image
          src={imageUrl}
          alt="Uploaded"
          width={24}
          height={24}
          className="object-cover rounded-full border border-blue-300"
          unoptimized={true} // Since these are user uploads from blob storage
        />
        {/* Fallback icon overlay if image fails to load */}
        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 rounded-full opacity-0 hover:opacity-50 transition-opacity">
          <ImageIcon className="w-3 h-3 text-blue-600" />
        </div>
      </div>

      {/* Filename */}
      <span className="text-blue-700 font-medium truncate flex-1 min-w-0">
        {truncatedName}
      </span>

      {/* Remove button */}
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
