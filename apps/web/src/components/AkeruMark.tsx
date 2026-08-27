import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

export function AkeruMark({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      aria-label="Akeru"
      className={cn("h-2.5 w-auto shrink-0", className)}
      viewBox="28 34 72 60"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M64 34L100 94H28L64 34ZM64 55L83 87H45L64 55Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <path d="M47 72H81V81H47V72Z" fill="currentColor" />
    </svg>
  );
}
