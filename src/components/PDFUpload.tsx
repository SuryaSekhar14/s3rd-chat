"use client";

import React, { useRef, useState, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { FileText, X, Upload, Loader2 } from "lucide-react";
import showToast from "@/lib/toast";

interface PDFUploadProps {
  onPDFUploaded: (pdfUrl: string, filename: string) => void;
  disabled?: boolean;
}

export function PDFUpload({ onPDFUploaded, disabled }: PDFUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedPDF, setUploadedPDF] = useState<{ url: string; filename: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (disabled || isUploading) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError("Please select a valid PDF file.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("PDF must be smaller than 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch(`/api/blob-upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload PDF');
      }

      const result = await response.json();
      setUploadedPDF({ url: result.url, filename: file.name });
      onPDFUploaded(result.url, file.name);
      showToast.success("PDF uploaded successfully!");
    } catch (error) {
      console.error("Error uploading PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setUploadError(`Failed to upload PDF: ${errorMessage}`);
      showToast.error(`Failed to upload PDF: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        handleFileSelect(file);
      } else {
        setUploadError("Please drop a valid PDF file.");
      }
    }
  };

  const handleRemovePDF = () => {
    setUploadedPDF(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {uploadedPDF ? (
        <div className="relative inline-block">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 truncate">
                {uploadedPDF.filename}
              </p>
              <p className="text-xs text-blue-600">PDF uploaded successfully</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 rounded-full p-0 text-blue-600 hover:text-blue-800"
              onClick={handleRemovePDF}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Uploading PDF...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-gray-400" />
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">
                Drop a PDF here or click to upload
              </p>
              <p className="text-xs text-gray-500">
                Supports PDF files (max 10MB)
              </p>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {uploadError}
        </div>
      )}
    </div>
  );
} 