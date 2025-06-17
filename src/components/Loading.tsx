"use client";

import React from "react";
import { LoadingSpinner } from "./icons/LoadingSpinner";

interface LoadingProps {
  /** Optional text to display below the spinner */
  text?: string;
  /** Optional CSS class to apply to the container */
  className?: string;
  /** Optional CSS class to apply to the spinner */
  spinnerClassName?: string;
}

export function Loading({
  text,
  className = "",
  spinnerClassName = "h-8 w-8 md:h-10 md:w-10",
}: LoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full w-full ${className}`}
    >
      <LoadingSpinner className={spinnerClassName} />
      {text && (
        <p className="text-muted-foreground mt-4 text-sm md:text-base animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
