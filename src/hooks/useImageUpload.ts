import { useState } from "react";

interface UploadResult {
  url: string;
  filename: string;
}

interface UploadError {
  message: string;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Check for unsupported formats
      if (file.type === "image/svg+xml") {
        throw new Error(
          "SVG images are not supported. Please use JPG, PNG, or GIF.",
        );
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("Image must be smaller than 10MB");
      }

      const response = await fetch(
        `/api/upload-image?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          body: file,
        },
      );

      if (!response.ok) {
        const error: UploadError = await response.json();
        throw new Error(error.message || "Failed to upload image");
      }

      const result: UploadResult = await response.json();
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setUploadError(errorMessage);
      console.error("Image upload error:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
    uploadError,
    clearError: () => setUploadError(null),
  };
}
