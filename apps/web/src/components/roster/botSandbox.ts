import type { Bot } from "./types";

export const BOT_SANDBOX_OPTIONS = [
  { value: "local", label: "Local" },
  { value: "vercel", label: "Vercel" },
  { value: "akeru-cloud", label: "Akeru Cloud" },
  { value: "upstash", label: "Upstash" },
] as const;

export type BotSandboxChoice = (typeof BOT_SANDBOX_OPTIONS)[number]["value"];

export function botSandboxChoice(sandbox: Bot["sandbox"]): BotSandboxChoice {
  return sandbox ?? "local";
}

export function botSandboxLabel(sandbox: BotSandboxChoice): string {
  return BOT_SANDBOX_OPTIONS.find((option) => option.value === sandbox)?.label ?? "Local";
}
