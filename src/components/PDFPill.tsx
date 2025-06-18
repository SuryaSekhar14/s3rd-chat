import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";

interface PDFPillProps {
  pdfUrl: string;
  fileName: string;
  onRemove: () => void;
  disabled?: boolean;
}

export function PDFPill({ pdfUrl, fileName, onRemove, disabled }: PDFPillProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg max-w-xs">
      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-blue-900 truncate">
          {fileName}
        </p>
        <button
          type="button"
          onClick={handleDownload}
          disabled={disabled}
          className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
        >
          Download
        </button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-5 w-5 rounded-full p-0 text-blue-600 hover:text-blue-800 flex-shrink-0"
        onClick={onRemove}
        disabled={disabled}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
} 