import { definePlugin } from "./definePlugin";

export default definePlugin({
  id: "executor",
  title: "Executor",
  description: "Use the integrations configured in your local Executor account.",
  category: "Productivity",
  logo: { src: "/plugin-logos/mcp.svg", darkSrc: "/plugin-logos/mcp-dark.svg" },
  featured: true,
  kind: "mcp-stdio",
  command: "bunx",
  args: ["-y", "executor", "mcp"],
  docsUrl: "https://executor.sh/docs",
  builtin: true,
});
