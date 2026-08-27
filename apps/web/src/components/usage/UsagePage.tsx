import { CheckIcon, RefreshCwIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { formatTokens, formatUsd, makeWindow } from "@t3tools/shared/usageFormat";

import { useUsage, type EnvironmentUsageStatus } from "../../state/usage";
import { Button } from "../ui/button";
import { DialogClose, DialogHeader, DialogPanel, DialogTitle } from "../ui/dialog";
import { PLAN_PROVIDER_ORDER, UsageActivityChart, UsagePlanMeters } from "./UsageCharts";
import { PROVIDER_PRESENTATION } from "./usageProviders";

export function UsagePage() {
  const [window] = useState(() => makeWindow(30));
  const { merged, environments, isPending, refresh } = useUsage(window);
  const planLimits = PLAN_PROVIDER_ORDER.map((provider) =>
    merged.planLimits.find((entry) => entry.provider === provider && entry.status === "ok"),
  ).filter((entry) => entry !== undefined);

  return (
    <>
      <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b px-5 py-3">
        <DialogTitle>Usage</DialogTitle>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => refresh()}
            aria-label="Refresh usage"
            size="icon"
            variant="ghost"
            disabled={isPending}
          >
            <RefreshCwIcon />
          </Button>
          <DialogClose aria-label="Close" render={<Button size="icon" variant="ghost" />}>
            <XIcon />
          </DialogClose>
        </div>
      </DialogHeader>

      <DialogPanel className="space-y-6 p-5">
        {environments.length > 1 ? <UsageDeviceStrip environments={environments} /> : null}
        <UsageCoverageNotice
          environments={environments}
          duplicateSources={merged.duplicateSources}
          staleEnvironments={merged.staleEnvironments}
        />
        {planLimits.length > 0 ? (
          <div className="grid gap-10 lg:grid-cols-2">
            {planLimits.map((limits) => (
              <UsagePlanMeters key={limits.provider} limits={limits} />
            ))}
          </div>
        ) : isPending ? null : environments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Connect an environment to see usage.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect a subscription in Settings to see plan limits.
          </p>
        )}

        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <h2 className="text-sm font-medium text-foreground">Activity</h2>
          {isPending && merged.totalTokens === 0 ? (
            <p className="text-sm text-muted-foreground">Reading transcripts…</p>
          ) : (
            <>
              <UsageActivityChart
                sinceDay={window.sinceDay}
                untilDay={window.untilDay}
                daily={merged.daily}
                providers={merged.providers}
              />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
                <Metric label="Processed tokens" value={formatTokens(merged.totalTokens)} />
                <Metric label="Cached input" value={formatTokens(merged.cachedInputTokens)} />
                <Metric label="Output" value={formatTokens(merged.outputTokens)} />
                <Metric
                  label="Cache savings"
                  value={formatUsd(merged.costQuality.cacheSavingsUsd)}
                />
              </div>
              {merged.models.length > 0 ? (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {merged.models.slice(0, 8).map((model) => (
                    <li
                      key={`${model.provider}:${model.model}`}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="min-w-0 truncate text-foreground">
                        {PROVIDER_PRESENTATION[model.provider].label} · {model.model}
                      </span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {formatTokens(model.totalTokens)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </section>
      </DialogPanel>
    </>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-base font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function UsageCoverageNotice({
  environments,
  duplicateSources,
  staleEnvironments,
}: {
  readonly environments: readonly EnvironmentUsageStatus[];
  readonly duplicateSources: readonly string[];
  readonly staleEnvironments: readonly string[];
}) {
  const failed = environments.filter((environment) => environment.error !== null);
  const stale = environments.filter((environment) =>
    staleEnvironments.includes(environment.environmentId),
  );
  if (failed.length === 0 && stale.length === 0 && duplicateSources.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 border border-border px-3 py-2 text-xs text-muted-foreground">
      {failed.map((environment) => (
        <span key={environment.label}>{environment.label} could not report usage.</span>
      ))}
      {stale.map((environment) => (
        <span key={environment.label}>
          {environment.label} runs an older server version and is excluded from totals.
        </span>
      ))}
      {duplicateSources.length > 0 ? (
        <span>
          Counted once across environments sharing a transcript directory:{" "}
          {duplicateSources.join(", ")}
        </span>
      ) : null}
    </div>
  );
}

function UsageDeviceStrip({
  environments,
}: {
  readonly environments: readonly EnvironmentUsageStatus[];
}) {
  const scanning = environments.filter(
    (environment) => environment.summary === null && environment.error === null,
  );
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border border-border px-3 py-2 text-xs">
      {environments.map((environment) => {
        if (environment.summary !== null) {
          return (
            <span
              key={environment.environmentId}
              className="flex items-center gap-1 text-foreground"
            >
              <CheckIcon className="size-3 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
              {environment.label}
            </span>
          );
        }
        if (environment.error !== null) {
          return (
            <span
              key={environment.environmentId}
              className="flex items-center gap-1 text-destructive"
            >
              <XIcon className="size-3" aria-hidden />
              {environment.label}
            </span>
          );
        }
        return (
          <span
            key={environment.environmentId}
            className="animate-status-pulse text-muted-foreground"
          >
            {environment.label}…
          </span>
        );
      })}
      <span className="ms-auto text-muted-foreground">
        {scanning.length === 1
          ? "1 device still scanning"
          : `${scanning.length} devices still scanning`}
      </span>
    </div>
  );
}
