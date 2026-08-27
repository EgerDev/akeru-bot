import {
  PLUGIN_CATEGORIES,
  type PluginCategory,
  type PluginDefinition,
} from "../../../../../plugins";

export type PluginFilter = "All" | "Featured" | PluginCategory;

export const PLUGIN_FILTERS: readonly PluginFilter[] = ["All", "Featured", ...PLUGIN_CATEGORIES];

export interface PluginSection {
  readonly title: string;
  readonly filter: PluginFilter;
  readonly plugins: readonly PluginDefinition[];
  readonly showViewAll: boolean;
}

export function buildInstalledPluginSection(input: {
  readonly plugins: readonly PluginDefinition[];
  readonly query: string;
}): readonly PluginSection[] {
  const query = input.query.trim().toLocaleLowerCase();
  const plugins = input.plugins.filter((plugin) =>
    `${plugin.title}\n${plugin.description}\n${plugin.category}`
      .toLocaleLowerCase()
      .includes(query),
  );
  return [{ title: "Installed", filter: "All", plugins, showViewAll: false }];
}

export function buildPluginSections(input: {
  readonly plugins: readonly PluginDefinition[];
  readonly query: string;
  readonly filter: PluginFilter;
}): readonly PluginSection[] {
  const query = input.query.trim().toLocaleLowerCase();
  const matching = input.plugins.filter((plugin) =>
    `${plugin.title}\n${plugin.description}\n${plugin.category}`
      .toLocaleLowerCase()
      .includes(query),
  );

  if (query) {
    const filtered =
      input.filter === "All"
        ? matching
        : matching.filter((plugin) =>
            input.filter === "Featured"
              ? plugin.featured === true
              : plugin.category === input.filter,
          );
    return [
      { title: "Search results", filter: input.filter, plugins: filtered, showViewAll: false },
    ];
  }

  if (input.filter === "Featured") {
    return [
      {
        title: "Featured",
        filter: "Featured",
        plugins: matching.filter((plugin) => plugin.featured === true),
        showViewAll: false,
      },
    ];
  }

  if (input.filter !== "All") {
    return [
      {
        title: input.filter,
        filter: input.filter,
        plugins: matching.filter((plugin) => plugin.category === input.filter),
        showViewAll: false,
      },
    ];
  }

  const sections: PluginSection[] = [
    {
      title: "Featured",
      filter: "Featured",
      plugins: matching.filter((plugin) => plugin.featured === true),
      showViewAll: true,
    },
  ];
  for (const category of PLUGIN_CATEGORIES) {
    const plugins = matching.filter((plugin) => plugin.category === category);
    if (plugins.length > 0) {
      sections.push({ title: category, filter: category, plugins, showViewAll: true });
    }
  }
  return sections;
}
