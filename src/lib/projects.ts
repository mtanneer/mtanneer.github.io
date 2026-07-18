import { getCollection } from 'astro:content';
import { fetchAllPublicRepos } from './github';
import configRaw from '../data/projects.config.yaml?raw';
import {
  parseConfig,
  listedManualIds,
  unconfiguredManualIds,
  unconfiguredRepoNames,
  mapManualEntry,
  mapAutoRepo,
  sortProjects,
} from './projects.pure';

export type { UnifiedProject } from './projects.pure';

export async function getListedManualIds(): Promise<Set<string>> {
  return listedManualIds(parseConfig(configRaw));
}

export async function getUnifiedProjects() {
  const config = parseConfig(configRaw);
  const manualConfigById = new Map(config.manual.map((m) => [m.id, m]));
  const autoConfigByRepo = new Map(config.auto.map((a) => [a.repo, a]));

  const allManualEntries = await getCollection('projects');
  const unconfiguredManual = unconfiguredManualIds(
    config,
    allManualEntries.map((e) => e.id)
  );
  if (unconfiguredManual.length > 0) {
    console.warn(
      `[projects] ${unconfiguredManual.length} manual project(s) not in src/data/projects.config.yaml: ${unconfiguredManual.join(', ')}`
    );
  }

  const manualProjects = allManualEntries
    .filter((entry) => manualConfigById.get(entry.id)?.include)
    .map((entry) => mapManualEntry(entry.id, entry.data, manualConfigById.get(entry.id)!));

  const allRepos = await fetchAllPublicRepos();
  const unconfigured = unconfiguredRepoNames(
    config,
    allRepos.map((r) => r.name)
  );
  if (unconfigured.length > 0) {
    console.warn(
      `[projects] ${unconfigured.length} public repo(s) not in src/data/projects.config.yaml: ${unconfigured.join(', ')}`
    );
  }

  const autoProjects = allRepos
    .filter((repo) => autoConfigByRepo.get(repo.name)?.include)
    .map((repo) => mapAutoRepo(repo, autoConfigByRepo.get(repo.name)!));

  return sortProjects([...manualProjects, ...autoProjects]);
}
