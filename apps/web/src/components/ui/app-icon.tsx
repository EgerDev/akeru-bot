import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

export function AppIcon({ strokeWidth = 1.8, ...props }: HugeiconsIconProps) {
  return <HugeiconsIcon aria-hidden="true" strokeWidth={strokeWidth} {...props} />;
}
