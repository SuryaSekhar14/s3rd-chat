import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { uiConfig } from "./config";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateTitle(title: string, maxLength?: number) {
  const effectiveMaxLength =
    maxLength ??
    (() => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      return isMobile
        ? uiConfig.maxHeaderChatTitleLengthMobile
        : uiConfig.maxHeaderChatTitleLengthDesktop;
    })();

  if (title.length <= effectiveMaxLength) return title;
  return `${title.slice(0, effectiveMaxLength)}...`;
}

// Format the date in a human-readable way
export function formatDateToWords(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true });
}
