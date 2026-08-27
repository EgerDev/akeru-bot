import { ArrowUpRightIcon, CheckIcon, ChevronLeftIcon, LinkIcon } from "lucide-react";
import type { PluginDefinition, PluginSkill } from "../../../../../plugins";
import { Button } from "../ui/button";
import { DialogHeader, DialogPanel, DialogTitle } from "../ui/dialog";
import { PluginLogoImage } from "./PluginsCatalog";

function connectorAccess(plugin: PluginDefinition): string {
  if (plugin.kind !== "mcp-url") return "Local";
  if (plugin.authentication === "oauth") return "OAuth";
  if (plugin.authentication === "optional-oauth") return "Optional OAuth";
  return "Public";
}

interface PluginDetailsContentProps {
  readonly plugin: PluginDefinition;
  readonly installed: boolean;
  readonly pending: boolean;
  readonly onToggle: (enabled: boolean) => void;
  readonly onCopySource: () => void;
  readonly onViewSource: () => void;
  readonly onOpenSkill: (skill: PluginSkill) => void;
}

export function PluginDetailsContent({
  plugin,
  installed,
  pending,
  onToggle,
  onCopySource,
  onViewSource,
  onOpenSkill,
}: PluginDetailsContentProps) {
  return (
    <DialogPanel className="px-6 pt-6! pb-6 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-2xl border bg-card/50 p-5">
          <div className="flex items-start gap-4">
            <PluginLogoImage className="size-14 rounded-xl" plugin={plugin} />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold">{plugin.title}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {plugin.category}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {plugin.description}
              </p>
            </div>
            <Button
              aria-label={`${installed ? "Remove" : "Add"} ${plugin.title}`}
              className="h-8 min-w-16 rounded-full px-3 text-xs"
              size="sm"
              variant={installed ? "secondary" : "default"}
              disabled={pending}
              onClick={() => onToggle(!installed)}
            >
              {installed ? <CheckIcon className="size-3.5" /> : null}
              {installed ? "Added" : "Add"}
            </Button>
          </div>
          {plugin.docsUrl ? (
            <div className="mt-4 flex items-center gap-1 border-t pt-3">
              <Button size="sm" variant="ghost-muted" onClick={onViewSource}>
                Documentation
                <ArrowUpRightIcon className="size-3.5" />
              </Button>
              <Button
                aria-label={`Copy ${plugin.title} source link`}
                size="sm"
                variant="ghost-muted"
                onClick={onCopySource}
              >
                <LinkIcon className="size-3.5" />
                Copy link
              </Button>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="plugin-connectors-title">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-xs font-medium text-muted-foreground" id="plugin-connectors-title">
              Connector
            </h3>
            <span className="text-[11px] text-muted-foreground">1 available</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/35 px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{plugin.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">MCP connector</p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {connectorAccess(plugin)}
            </span>
          </div>
        </section>

        {plugin.skills?.length ? (
          <section aria-labelledby="plugin-skills-title">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-xs font-medium text-muted-foreground" id="plugin-skills-title">
                Skills
              </h3>
              <span className="text-[11px] text-muted-foreground">Installed separately</span>
            </div>
            <div className="overflow-hidden rounded-xl border bg-muted/35">
              {plugin.skills.map((skill) => (
                <button
                  className="group flex w-full cursor-pointer items-center justify-between gap-4 border-b px-4 py-3.5 text-start outline-hidden transition-colors last:border-b-0 hover:bg-muted/55 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  key={skill.url}
                  type="button"
                  onClick={() => onOpenSkill(skill)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{skill.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {skill.description}
                    </p>
                  </div>
                  <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </DialogPanel>
  );
}

export function PluginDetails({
  plugin,
  installed,
  pending,
  onBack,
  onToggle,
  onCopySource,
  onViewSource,
  onOpenSkill,
}: PluginDetailsContentProps & { readonly onBack: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col" data-plugin-details="">
      <DialogHeader className="border-b px-5 py-4">
        <div className="flex items-center gap-2 pe-8">
          <Button aria-label="Back to plugins" size="icon-sm" variant="ghost" onClick={onBack}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <DialogTitle className="text-base">Plugin details</DialogTitle>
        </div>
      </DialogHeader>
      <PluginDetailsContent
        plugin={plugin}
        installed={installed}
        pending={pending}
        onToggle={onToggle}
        onCopySource={onCopySource}
        onViewSource={onViewSource}
        onOpenSkill={onOpenSkill}
      />
    </div>
  );
}
