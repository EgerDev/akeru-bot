import { createFileRoute, redirect } from "@tanstack/react-router";

import { openUsage } from "../usageDialogStore";

/**
 * Usage is a modal now. The route only survives so old deep links and
 * history entries still land somewhere useful: it opens the dialog and hands
 * the user back to the workspace.
 */
export const Route = createFileRoute("/usage")({
  beforeLoad: async ({ context }) => {
    if (
      context.authGateState.status !== "authenticated" &&
      context.authGateState.status !== "hosted-static"
    ) {
      throw redirect({ to: "/pair", replace: true });
    }

    openUsage();
    throw redirect({ to: "/", replace: true });
  },
});
