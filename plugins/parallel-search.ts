import { definePlugin } from "./definePlugin";

export default definePlugin({
  id: "parallel-search",
  title: "Parallel Search",
  description: "Search the web and extract token-efficient content from URLs.",
  category: "Search",
  logo: { src: "/plugin-logos/parallel.svg" },
  featured: true,
  kind: "mcp-url",
  authentication: "oauth",
  url: "https://search.parallel.ai/mcp-oauth",
  docsUrl: "https://docs.parallel.ai/integrations/mcp/search-mcp",
  skills: [
    {
      title: "Parallel Web Search",
      description: "Run ranked web searches through the Parallel CLI.",
      url: "https://skills.sh/parallel-web/parallel-agent-skills/parallel-web-search",
    },
  ],
  builtin: true,
});
