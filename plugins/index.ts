import type { PluginDefinition } from "./definePlugin";

interface PluginModule {
  readonly default: PluginDefinition;
}

const catalogModules = import.meta.glob<PluginModule>(
  ["./*.ts", "!./definePlugin.ts", "!./index.ts", "!./*.test.ts"],
  { eager: true },
);

export function loadCatalog(
  modules: Readonly<Record<string, PluginModule>> = catalogModules,
): readonly PluginDefinition[] {
  const plugins = Object.entries(modules).map(([path, module]) => {
    if (!module.default)
      throw new TypeError(`Plugin module '${path}' must export a default plugin.`);
    return module.default;
  });
  const ids = new Set<string>();
  for (const plugin of plugins) {
    if (ids.has(plugin.id)) throw new TypeError(`Duplicate plugin id '${plugin.id}'.`);
    ids.add(plugin.id);
  }
  return Object.freeze(plugins.toSorted((left, right) => left.title.localeCompare(right.title)));
}

export { PLUGIN_CATEGORIES } from "./definePlugin";
export type {
  PluginCategory,
  PluginDefinition,
  PluginKind,
  PluginLogo,
  PluginSkill,
} from "./definePlugin";
