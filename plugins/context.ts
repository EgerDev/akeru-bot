import { definePlugin } from "./definePlugin";

export default definePlugin({
  id: "context",
  title: "Context.dev",
  description: "Scrape, extract, parse, enrich, and monitor web data.",
  category: "Data Extraction",
  logo: {
    src: "/plugin-logos/context.png",
    darkSrc: "/plugin-logos/context-dark.png",
  },
  featured: true,
  kind: "mcp-url",
  authentication: "oauth",
  url: "https://mcp.context.dev/mcp",
  docsUrl: "https://docs.context.dev/install-mcp",
  builtin: true,
});
