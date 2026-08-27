import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import { BotActivityStatus } from "./BotActivityStatus";

describe("bot activity status", () => {
  it("shows a compact working label without tool details", () => {
    const markup = renderToStaticMarkup(
      <BotActivityStatus
        avatar={{ kind: "blob", shape: "circle", color: "#5B7FD4" }}
        name="Akeru"
      />,
    );

    expect(markup).toContain("Akeru is working");
    expect(markup).toContain("bot-status-shimmer");
    expect(markup).not.toContain("tool");
  });
});
