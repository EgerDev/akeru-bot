import { createFileRoute, redirect } from "@tanstack/react-router";

import { isLegacyPluginsPath, openPlugins } from "../pluginsDialogStore";
import { openSettings, settingsSectionFromPathname } from "../settingsDialogStore";

/**
 * Settings is a modal now. The route only survives so old deep links and
 * history entries still land somewhere useful: it opens the dialog and hands
 * the user back to the workspace.
 */
export const Route = createFileRoute("/settings")({
  beforeLoad: async ({ context, location }) => {
    if (
      context.authGateState.status !== "authenticated" &&
      context.authGateState.status !== "hosted-static"
    ) {
      throw redirect({ to: "/pair", replace: true });
    }

    if (isLegacyPluginsPath(location.pathname)) {
      openPlugins();
    } else {
      openSettings(settingsSectionFromPathname(location.pathname));
    }
    throw redirect({ to: "/", replace: true });
  },
});
