import React, { useState, useRef, useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useHotkeys as useReactHotkeys } from 'react-hotkeys-hook';

import { personaPrompts } from "@/lib/prompts";
import { getSubmitButton } from "@/lib/utils/getSubmitButton";
import { useChatViewModel } from "@/hooks/useViewModel";
import { useOperatingSystem } from "@/hooks/useOperatingSystem";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useModel } from "@/hooks/useModel";
import showToast from "@/lib/toast";
import { ModelSelector } from "@/components/ModelSelector";

interface ChatInputProps {
  input: string;
  handleSubmit: (e: React.FormEvent) => void;
  setInput: (value: string) => void;
  stop: () => void;
  status: 'streaming' | 'submitted' | 'ready' | 'error';
}

export const ChatInput = observer(function ChatInput({ input, handleSubmit, setInput, stop, status }: ChatInputProps) {
  const chatViewModel = useChatViewModel();
  const os = useOperatingSystem();
  const [isAnimating, setIsAnimating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const previousStatusRef = useRef(status);
  const { selectedModelId, setSelectedModel, availableModels } = useModel();

  // Auto-focus when AI stops responding
  useEffect(() => {
    // Focus when status changes from streaming/submitted to ready
    if ((previousStatusRef.current === 'streaming' || previousStatusRef.current === 'submitted') && 
        status === 'ready') {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
    // Update previous status
    previousStatusRef.current = status;
  }, [status]);

  // Setup hotkeys
  const isMac = os === 'macos';
  const modKey = isMac ? 'meta' : 'ctrl';
  
  useReactHotkeys(`${modKey}+Enter`, (e) => {
    e.preventDefault();
    if (input.trim() && !chatViewModel.generating) {
      onSubmit(e as unknown as React.FormEvent);
    }
  }, {
    enableOnFormTags: ['TEXTAREA'],
    preventDefault: true
  });

  // Setup utility hotkeys
  useHotkeys({
    input,
    stop,
    setInput
  });

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    const model = availableModels.find(m => m.id === modelId);
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
            color: `rgba(${pixelData[i]}, ${pixelData[i + 1]}, ${pixelData[i + 2]}, ${pixelData[i + 3] / 255})`
          });
        }
      }
    }

    particlesRef.current = particles;
  }, [input]);

  const animate = useCallback((start: number) => {
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
  }, [setInput]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatViewModel.generating) return;

    setIsAnimating(true);
    draw();

    const maxX = particlesRef.current.reduce(
      (prev, current) => (current.x > prev ? current.x : prev),
      0
    );
    animate(maxX);
    handleSubmit(e);
  };

  return (
    <div className="border-t p-2 md:p-4">
      <form 
        onSubmit={onSubmit}
        className="flex flex-col gap-2"
      >
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`absolute pointer-events-none transform scale-50 origin-top-left ${
              !isAnimating ? "opacity-0" : "opacity-100"
            }`}
          />
          <Textarea
            ref={textareaRef}
            placeholder="Type something here..."
            className={`min-h-10 max-h-[200px] w-full resize-none overflow-y-auto whitespace-pre-wrap break-words text-sm md:text-base pr-10 z-10 ${
              isAnimating ? "text-transparent" : ""
            }`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatViewModel.generating || chatViewModel.enhancing}
            rows={1}
            autoComplete="off"
            spellCheck="false"
            tabIndex={0}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => chatViewModel.enhancePrompt(input, setInput)}
            disabled={chatViewModel.generating || chatViewModel.enhancing || !input.trim()}
          >
            <Sparkles className={`h-4 w-4 ${chatViewModel.enhancing ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Select 
              value={chatViewModel.selectedPersona} 
              onValueChange={(persona) => chatViewModel.setSelectedPersona(persona)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
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
            
            <ModelSelector
              selectedModelId={selectedModelId}
              availableModels={availableModels}
              onModelChange={handleModelChange}
            />
          </div>
          
          {chatViewModel.generating ? (
            <Button 
              onClick={stop}
              variant="destructive"
              size="sm"
              className="h-8 px-2 md:px-3"
            > 
              Stop
            </Button>
          ) : (
            <Button 
              type="submit" 
              className="h-8 px-2 md:px-4"
              disabled={chatViewModel.generating || !input.trim()}
            >
              {getSubmitButton(os)}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}); 