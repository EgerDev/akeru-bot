import { BotAvatarView } from "./BotAvatarView";
import type { BotAvatar } from "./types";

export function BotActivityStatus({
  avatar,
  name,
}: {
  readonly avatar: BotAvatar;
  readonly name: string;
}) {
  return (
    <div
      aria-live="polite"
      className="flex items-center gap-2.5 text-sm"
      data-testid="bot-activity-status"
    >
      <BotAvatarView avatar={avatar} name={name} className="size-7 shrink-0" state="working" />
      <span className="bot-status-shimmer font-medium">{name} is working</span>
    </div>
  );
}
