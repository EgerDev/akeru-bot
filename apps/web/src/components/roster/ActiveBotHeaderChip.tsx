import { useState } from "react";

import { AvatarPickerDialog } from "./AvatarPickerDialog";
import { BotAvatarView } from "./BotAvatarView";
import { useSelectedBot } from "./rosterStore";

/**
 * The active bot's avatar and name, leading the chat header. Clicking the
 * avatar opens the avatar picker for that bot.
 */
export function ActiveBotHeaderChip() {
  const bot = useSelectedBot();
  const [pickerOpen, setPickerOpen] = useState(false);
  if (bot === null) return null;
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        aria-label={`Change avatar for ${bot.name}`}
        data-bot-hover
        onClick={() => setPickerOpen(true)}
        className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BotAvatarView avatar={bot.avatar} name={bot.name} className="size-6" />
      </button>
      <span className="max-w-32 truncate text-sm font-medium text-foreground">{bot.name}</span>
      {pickerOpen ? <AvatarPickerDialog bot={bot} open onOpenChange={setPickerOpen} /> : null}
    </div>
  );
}
