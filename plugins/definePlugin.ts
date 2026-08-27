export type PluginKind = "mcp-stdio" | "mcp-url";

export const PLUGIN_CATEGORIES = ["Data Extraction", "Search", "Productivity"] as const;

export type PluginCategory = (typeof PLUGIN_CATEGORIES)[number];

export interface PluginLogo {
  readonly src: `/plugin-logos/${string}`;
  readonly darkSrc?: `/plugin-logos/${string}`;
}

export interface PluginSkill {
  readonly title: string;
  readonly description: string;
  readonly url: `https://${string}`;
}

interface PluginBase {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: PluginCategory;
  readonly logo: PluginLogo;
  readonly featured?: true;
  readonly docsUrl?: string;
  readonly skills?: readonly PluginSkill[];
  readonly builtin: true;
}

interface CommandPlugin extends PluginBase {
  readonly kind: "mcp-stdio";
  readonly command: string;
  readonly args?: readonly string[];
  readonly url?: never;
}

interface UrlPlugin extends PluginBase {
  readonly kind: "mcp-url";
  readonly url: string;
  readonly authentication: "none" | "oauth" | "optional-oauth";
  readonly command?: never;
  readonly args?: never;
}

export type PluginDefinition = CommandPlugin | UrlPlugin;

const PLUGIN_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DISALLOWED_PROVIDER = ["pipe", "dream"].join("");

export function definePlugin<const T extends PluginDefinition>(plugin: T): Readonly<T> {
  if (!PLUGIN_ID.test(plugin.id)) {
    throw new TypeError(`Plugin id '${plugin.id}' must use stable kebab-case.`);
  }
  if (plugin.id.includes(DISALLOWED_PROVIDER)) {
    throw new TypeError(`Plugin id '${plugin.id}' names an unsupported provider.`);
  }
  if (!plugin.logo.src.startsWith("/plugin-logos/")) {
    throw new TypeError(`Plugin '${plugin.id}' needs a local logo.`);
  }
  if (plugin.title.trim().length === 0 || plugin.description.trim().length === 0) {
    throw new TypeError(`Plugin '${plugin.id}' needs a title and description.`);
  }
  for (const skill of plugin.skills ?? []) {
    if (skill.title.trim().length === 0 || skill.description.trim().length === 0) {
      throw new TypeError(`Plugin '${plugin.id}' has an incomplete skill.`);
    }
    if (new URL(skill.url).protocol !== "https:") {
      throw new TypeError(`Plugin '${plugin.id}' skill URLs must use HTTPS.`);
    }
  }
  if (plugin.kind === "mcp-url") {
    const url = new URL(plugin.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new TypeError(`Plugin '${plugin.id}' needs an HTTP or HTTPS URL.`);
    }
  } else if (plugin.command.trim().length === 0) {
    throw new TypeError(`Plugin '${plugin.id}' needs a command.`);
  }
  return Object.freeze(plugin);
}
