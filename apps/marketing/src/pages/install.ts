import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";

import type { APIRoute } from "astro";

const installScript = NodeFS.readFileSync(
  NodePath.resolve(
    NodePath.dirname(NodeURL.fileURLToPath(import.meta.url)),
    "../../../../scripts/install-macos.sh",
  ),
  "utf8",
);

export const GET: APIRoute = () =>
  new Response(installScript, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
