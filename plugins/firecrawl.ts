import { definePlugin } from "./definePlugin";

export default definePlugin({
  id: "firecrawl",
  title: "Firecrawl",
  description: "Search, scrape, and extract structured data from the web.",
  category: "Data Extraction",
  logo: {
    src: "/plugin-logos/firecrawl.svg",
    darkSrc: "/plugin-logos/firecrawl-dark.svg",
  },
  featured: true,
  kind: "mcp-url",
  authentication: "oauth",
  url: "https://mcp.firecrawl.dev/v2/mcp-oauth",
  docsUrl: "https://docs.firecrawl.dev/mcp-server/oauth",
  skills: [
    {
      title: "Firecrawl CLI",
      description: "Search, scrape, crawl, and extract through the Firecrawl CLI.",
      url: "https://skills.sh/firecrawl/cli/firecrawl",
    },
  ],
  builtin: true,
});
