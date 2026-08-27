import type { LocalApi } from "@t3tools/contracts";
import * as Schema from "effect/Schema";

export class PullRequestLinkOpenError extends Schema.TaggedErrorClass<PullRequestLinkOpenError>()(
  "PullRequestLinkOpenError",
  {
    targetOrigin: Schema.NullOr(Schema.String),
    cause: Schema.Defect(),
  },
) {
  static fromCause(targetUrl: string, cause: unknown): PullRequestLinkOpenError {
    let targetOrigin: string | null = null;
    try {
      targetOrigin = new URL(targetUrl).origin;
    } catch {
      // Keep malformed URLs out of diagnostics.
    }
    return new PullRequestLinkOpenError({ targetOrigin, cause });
  }

  override get message(): string {
    return this.targetOrigin === null
      ? "Unable to open pull request link."
      : `Unable to open pull request link at ${this.targetOrigin}.`;
  }
}

export async function openPullRequestLink(
  shell: Pick<LocalApi["shell"], "openExternal">,
  targetUrl: string,
): Promise<void> {
  try {
    await shell.openExternal(targetUrl);
  } catch (cause) {
    throw PullRequestLinkOpenError.fromCause(targetUrl, cause);
  }
}

export function useOpenPrLink(..._args: unknown[]) {
  return (
    event: { preventDefault(): void; stopPropagation(): void },
    url: string,
    _threadRef?: unknown,
  ): boolean => {
    event.stopPropagation();
    event.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
    return false;
  };
}

export function parseChangeRequestUrl(_href: string): {
  repository: string;
  number: number;
} | null {
  return null;
}

export function findProjectForChangeRequest(..._args: unknown[]): undefined {
  return undefined;
}

export function matchesLinkedPullRequestUrl(..._args: unknown[]): false {
  return false;
}

export function useOpenChangeRequestLink(..._args: unknown[]) {
  return (_event: unknown, url: string, _threadRef?: unknown): boolean => {
    window.open(url, "_blank", "noopener,noreferrer");
    return false;
  };
}
