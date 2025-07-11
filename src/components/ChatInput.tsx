import React, { useState, useRef, useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Sparkles, ImageIcon, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHotkeys as useReactHotkeys } from "react-hotkeys-hook";

import { personaPrompts } from "@/lib/prompts";
import { getSubmitButton } from "@/lib/utils/getSubmitButton";
import { useChatViewModel } from "@/hooks/useViewModel";
import { useOperatingSystem } from "@/hooks/useOperatingSystem";

import { ImageUpload } from "@/components/ImageUpload";
import { ImagePill } from "@/components/ImagePill";
import { PDFUpload } from "@/components/PDFUpload";
import { PDFPill } from "@/components/PDFPill";
import { useModel } from "@/hooks/useModel";
import showToast from "@/lib/toast";
import { ModelSelector } from "@/components/ModelSelector";
import { analytics, ANALYTICS_EVENTS, ANALYTICS_PROPERTIES } from "@/lib/analytics";

interface ChatInputProps {
  input: string;
  handleSubmit: (e: React.FormEvent, imageUrl?: string, pdfData?: { url: string; filename: string }) => void;
  setInput: (value: string) => void;
  stop: () => void;
  status: "streaming" | "submitted" | "ready" | "error";
  onPDFProcessed?: (pdfUrl: string, filename: string) => void;
  isPreviewMode?: boolean;
}

export const ChatInput = observer(function ChatInput({
  input,
  handleSubmit,
  setInput,
  stop,
  status,
  onPDFProcessed,
  isPreviewMode = false,
}: ChatInputProps) {
  const chatViewModel = useChatViewModel();
  const os = useOperatingSystem();
  const [isAnimating, setIsAnimating] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ url: string; filename: string }>
  >([]);
  const [uploadedPDFs, setUploadedPDFs] = useState<
    Array<{ url: string; filename: string }>
  >([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const previousStatusRef = useRef(status);
  const { selectedModelId, setSelectedModel, availableModels } = useModel();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Auto-focus when AI stops responding
  useEffect(() => {
    // Focus when status changes from streaming/submitted to ready
    if (
      (previousStatusRef.current === "streaming" ||
        previousStatusRef.current === "submitted") &&
      status === "ready"
    ) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
    // Update previous status
    previousStatusRef.current = status;
  }, [status]);

  // Setup hotkeys
  const isMac = os === "macos";
  const modKey = isMac ? "meta" : "ctrl";

  useReactHotkeys(
    `${modKey}+Enter`,
    (e) => {
      e.preventDefault();
      if (input.trim() && !chatViewModel.generating) {
        onSubmit(e as unknown as React.FormEvent);
      }
    },
    {
      enableOnFormTags: ["TEXTAREA"],
      preventDefault: true,
    },
  );

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    const model = availableModels.find((m) => m.id === modelId);
    
    // Track model change
    analytics.track(ANALYTICS_EVENTS.MODEL_CHANGED, {
      [ANALYTICS_PROPERTIES.MODEL_ID]: modelId,
      [ANALYTICS_PROPERTIES.MODEL_NAME]: model?.name || modelId,
      [ANALYTICS_PROPERTIES.MODEL_PROVIDER]: model?.provider || 'unknown',
    });
    
    showToast.success(`Model changed to ${model?.name || modelId}`);
  };

  const draw = useCallback(() => {
    if (!textareaRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 100;
    ctx.clearRect(0, 0, 800, 100);

    const computedStyles = getComputedStyle(textareaRef.current);
    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = computedStyles.color;
    ctx.fillText(input, 16, 55);

    const imageData = ctx.getImageData(0, 0, 800, 100);
    const pixelData = imageData.data;
    const particles: any[] = [];

    for (let y = 0; y < 200; y += 2) {
      for (let x = 0; x < 800; x += 2) {
        const i = (y * 800 + x) * 4;
        if (pixelData[i + 3] > 128) {
          particles.push({
            x,
            y,
            r: 1,
            color: `rgba(${pixelData[i]}, ${pixelData[i + 1]}, ${
              pixelData[i + 2]
            }, ${pixelData[i + 3] / 255})`,
          });
        }
      }
    }

    particlesRef.current = particles;
  }, [input]);

  const animate = useCallback(
    (start: number) => {
      const animateFrame = (pos: number = 0) => {
        requestAnimationFrame(() => {
          const newParticles = [];
          for (const particle of particlesRef.current) {
            if (particle.x < pos) {
              newParticles.push(particle);
            } else {
              if (particle.r <= 0) {
                particle.r = 0;
                continue;
              }
              particle.x += Math.random() > 0.5 ? 1 : -1;
              particle.y += Math.random() > 0.5 ? 1 : -1;
              particle.r -= 0.05 * Math.random();
              newParticles.push(particle);
            }
          }
          particlesRef.current = newParticles;

          const ctx = canvasRef.current?.getContext("2d");
          if (ctx) {
            ctx.clearRect(pos, 0, 800, 200);
            particlesRef.current.forEach((p) => {
              if (p.x > pos) {
                ctx.beginPath();
                ctx.rect(p.x, p.y, p.r, p.r);
                ctx.fillStyle = p.color;
                ctx.fill();
              }
            });
          }

          if (particlesRef.current.length > 0) {
            animateFrame(pos - 8);
          } else {
            setIsAnimating(false);
            setInput("");
          }
        });
      };
      animateFrame(start);
    },
    [setInput],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!input.trim() && uploadedImages.length === 0 && uploadedPDFs.length === 0) ||
      chatViewModel.generating
    )
      return;

    setIsAnimating(true);
    draw();

    const maxX = particlesRef.current.reduce(
      (prev, current) => (current.x > prev ? current.x : prev),
      0,
    );
    animate(maxX);
    
    const imageUrl = uploadedImages.length > 0 ? uploadedImages[0].url : undefined;
    const pdfData = uploadedPDFs.length > 0 ? uploadedPDFs[0] : undefined;
    
    handleSubmit(e, imageUrl, pdfData);

    setUploadedImages([]);
    setUploadedPDFs([]);
    setShowImageUpload(false);
    setShowPDFUpload(false);
  };

  const handleImageUploaded = (imageUrl: string) => {
    console.log('[ChatInput] Image upload completed:', imageUrl);
    setIsUploadingImage(false);
    const filename = imageUrl.split("/").pop()?.split("?")[0] || "image";
    
    // Track successful image upload
    analytics.trackFileUpload('image', filename, 0, 'click', true);
    
    setUploadedImages((prev) => {
      const newImages = [...prev, { url: imageUrl, filename }];
      console.log('[ChatInput] Updated uploadedImages:', newImages);
      return newImages;
    });
    setShowImageUpload(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    // Track image removal
    analytics.track(ANALYTICS_EVENTS.IMAGE_REMOVED, {
      [ANALYTICS_PROPERTIES.FILE_TYPE]: 'image',
    });
    
    setUploadedImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handlePDFUploaded = (pdfUrl: string, filename: string) => {
    // Track successful PDF upload
    analytics.trackFileUpload('pdf', filename, 0, 'click', true);
    
    setUploadedPDFs((prev) => [...prev, { url: pdfUrl, filename }]);
    setShowPDFUpload(false);
    setPdfUrl(pdfUrl);
    setPdfFilename(filename);
    if (typeof onPDFProcessed === 'function') {
      onPDFProcessed(pdfUrl, filename);
    }
  };

  const handleRemovePDF = (indexToRemove: number) => {
    // Track PDF removal
    analytics.track(ANALYTICS_EVENTS.PDF_REMOVED, {
      [ANALYTICS_PROPERTIES.FILE_TYPE]: 'pdf',
    });
    
    setUploadedPDFs((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type.startsWith("image/")) {
        e.preventDefault();

        const file = item.getAsFile();
        if (file) {
          if (file.type === "image/svg+xml") {
            showToast.error(
              "SVG images are not supported. Please use JPG, PNG, or GIF.",
            );
            continue;
          }

          if (!file.type.startsWith("image/")) {
            showToast.error("Please paste a valid image file.");
            continue;
          }

          const maxSize = 10 * 1024 * 1024;
          if (file.size > maxSize) {
            showToast.error("Image must be smaller than 10MB.");
            continue;
          }

          try {
            setIsUploadingImage(true);
            const response = await fetch(
              `/api/upload-image?filename=${encodeURIComponent(
                file.name || "pasted-image",
              )}`,
              {
                method: "POST",
                body: file,
              },
            );

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || "Failed to upload image");
            }

            const result = await response.json();
            const filename = result.filename || file.name || "pasted-image";
            
            // Track successful paste upload
            analytics.trackFileUpload('image', filename, file.size, 'paste', true);
            analytics.track(ANALYTICS_EVENTS.FILE_PASTED, {
              [ANALYTICS_PROPERTIES.FILE_TYPE]: 'image',
              [ANALYTICS_PROPERTIES.FILE_SIZE]: file.size,
              [ANALYTICS_PROPERTIES.FILE_NAME]: filename,
            });
            
            setUploadedImages((prev) => [
              ...prev,
              { url: result.url, filename },
            ]);
            showToast.success("Image pasted and uploaded successfully!");
          } catch (error) {
            console.error("Error uploading pasted image:", error);
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error occurred";
            
            // Track failed paste upload
            analytics.trackFileUpload('image', file.name || 'pasted-image', file.size, 'paste', false);
            
            showToast.error(`Failed to upload pasted image: ${errorMessage}`);
          } finally {
            setIsUploadingImage(false);
          }
        }
        break;
      }
    }
  };

  const getPlaceholderText = () => {
    if (uploadedImages.length > 0) {
      return "Ask something about this image...";
    }
    if (uploadedPDFs.length > 0) {
      return "Ask something about this PDF...";
    }
    if (isPreviewMode) {
      return "Type your message here...";
    }
    return "Type something here, paste an image, or upload a PDF";
  };

  return (
    <div className="border-t p-2 md:p-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        {showImageUpload && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <ImageUpload
              onImageUploaded={handleImageUploaded}
              disabled={chatViewModel.generating}
            />
          </div>
        )}
        {showPDFUpload && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <PDFUpload
              onPDFUploaded={handlePDFUploaded}
              disabled={chatViewModel.generating}
            />
          </div>
        )}
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2">
            {uploadedImages.map((image, index) => (
              <ImagePill
                key={`${image.url}-${index}`}
                imageUrl={image.url}
                fileName={image.filename}
                onRemove={() => handleRemoveImage(index)}
                disabled={chatViewModel.generating}
              />
            ))}
          </div>
        )}
        {uploadedPDFs.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2">
            {uploadedPDFs.map((pdf, index) => (
              <PDFPill
                key={`${pdf.url}-${index}`}
                pdfUrl={pdf.url}
                fileName={pdf.filename}
                onRemove={() => handleRemovePDF(index)}
                disabled={chatViewModel.generating}
              />
            ))}
          </div>
        )}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`absolute pointer-events-none transform scale-50 origin-top-left ${
              !isAnimating ? "opacity-0" : "opacity-100"
            }`}
          />
          <Textarea
            ref={textareaRef}
            placeholder={getPlaceholderText()}
            className={`min-h-10 max-h-[200px] w-full resize-none overflow-y-auto whitespace-pre-wrap break-words text-sm md:text-base pr-10 z-10 ${
              isAnimating ? "text-transparent" : ""
            }`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatViewModel.generating || chatViewModel.enhancing}
            rows={1}
            onPaste={handlePaste}
            autoComplete="off"
            spellCheck="false"
            tabIndex={0}
          />

          <div className="absolute right-2 top-2 flex gap-1">
            {!isPreviewMode && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setShowImageUpload(!showImageUpload);
                    setShowPDFUpload(false);
                  }}
                  disabled={chatViewModel.generating}
                  title="Upload image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setShowPDFUpload(!showPDFUpload);
                    setShowImageUpload(false);
                  }}
                  disabled={chatViewModel.generating}
                  title="Upload PDF"
                >
                  <FileText className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() => chatViewModel.enhancePrompt(input, setInput)}
                  disabled={
                    chatViewModel.generating ||
                    chatViewModel.enhancing ||
                    !input.trim()
                  }
                  title="Enhance prompt"
                >
                  <Sparkles
                    className={`h-4 w-4 ${
                      chatViewModel.enhancing ? "animate-pulse" : ""
                    }`}
                  />
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <Select
              value={chatViewModel.selectedPersona}
              onValueChange={(persona) => {
                // Track persona selection
                analytics.track(ANALYTICS_EVENTS.PERSONA_SELECTED, {
                  persona_id: persona,
                  persona_name: personaPrompts[persona as keyof typeof personaPrompts]?.name || persona,
                });
                chatViewModel.setSelectedPersona(persona);
              }}
            >
              <SelectTrigger className="w-1/3 sm:w-[140px] h-8 text-xs">
                <SelectValue placeholder="Select persona" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(personaPrompts).map(([key, persona]) => (
                  <SelectItem key={key} value={key}>
                    {persona.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="w-1/3 sm:w-auto">
              <ModelSelector
                selectedModelId={selectedModelId}
                availableModels={availableModels}
                onModelChange={handleModelChange}
              />
            </div>
          </div>

          {chatViewModel.generating ? (
            <Button
              onClick={stop}
              variant="destructive"
              size="sm"
              className="h-8 px-2 md:px-3"
            >
              <span className="hidden sm:inline">Stop</span>
              <span className="sm:hidden">Stop</span>
            </Button>
          ) : (
            <Button
              type="submit"
              className="h-8 px-2 sm:px-4 flex-shrink-0"
              disabled={
                isUploadingImage ||
                chatViewModel.generating ||
                (isPreviewMode ? !input.trim() : (!input.trim() && uploadedImages.length === 0 && uploadedPDFs.length === 0))
              }
            >
              {isUploadingImage ? (
                <span className="flex items-center"><svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Uploading...</span>
              ) : (
                <>
                  <Send className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">{getSubmitButton(os)}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
});
