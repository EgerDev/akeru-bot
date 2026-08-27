import { definePlugin } from "./definePlugin";

export default definePlugin({
  id: "exa",
  title: "Exa",
  description: "Search the web, find code, and run focused research.",
  category: "Search",
  logo: { src: "/plugin-logos/exa.svg" },
  featured: true,
  kind: "mcp-url",
  authentication: "optional-oauth",
  url: "https://mcp.exa.ai/mcp",
  docsUrl: "https://exa.ai/mcp",
  skills: [
    {
      title: "Exa Search",
      description: "Search the web through the Exa CLI.",
      url: "https://skills.sh/exa-labs/agent-skills/exa-search",
    },
  ],
  builtin: true,
});
