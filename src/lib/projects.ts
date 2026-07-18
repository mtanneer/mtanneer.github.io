import { load } from 'js-yaml';
import { getCollection } from 'astro:content';
import { fetchAllPublicRepos, type PublicRepo } from './github';
import configRaw from '../data/projects.config.yaml?raw';

interface AutoConfigEntry {
  repo: string;
  include: boolean;
  pinned?: boolean;
  order?: number;
  description?: string;
  tags?: string[];
  icon?: string;
}

interface ManualConfigEntry {
  id: string;
  include: boolean;
  pinned?: boolean;
  order?: number;
}

interface ProjectsConfig {
  auto: AutoConfigEntry[];
  manual: ManualConfigEntry[];
}

interface ManualEntryData {
  title: string;
  icon?: string;
  description: string;
  tags: string[];
  date: Date;
}

export interface UnifiedProject {
  id: string;
  title: string;
  icon?: string;
  description: string;
  tags: string[];
  url: string;
  pinned: boolean;
  order: number;
  date: Date;
  source: 'manual' | 'auto';
  hasDetailPage: boolean;
}

const UNPINNED_ORDER = Number.MAX_SAFE_INTEGER;
const FALLBACK_ICON = '◇';

function parseConfig(raw: string): ProjectsConfig {
  const parsed = raw.trim() === '' ? undefined : (load(raw) as Partial<ProjectsConfig> | undefined);
  return { auto: parsed?.auto ?? [], manual: parsed?.manual ?? [] };
}

// Duplicate `id`/`repo` keys in the yaml resolve last-wins, matching the
// Map-based lookups built from these arrays below.
function listedManualIds(config: ProjectsConfig): Set<string> {
  const byId = new Map(config.manual.map((m) => [m.id, m]));
  return new Set([...byId.values()].filter((m) => m.include).map((m) => m.id));
}

function mapManualEntry(id: string, data: ManualEntryData, cfg: ManualConfigEntry): UnifiedProject {
  return {
    id,
    title: data.title,
    icon: data.icon,
    description: data.description,
    tags: data.tags,
    url: `/projects/${id}/`,
    pinned: cfg.pinned ?? false,
    order: cfg.pinned ? cfg.order ?? UNPINNED_ORDER : UNPINNED_ORDER,
    date: data.date,
    source: 'manual',
    hasDetailPage: true,
  };
}

function mapAutoRepo(repo: PublicRepo, cfg: AutoConfigEntry): UnifiedProject {
  return {
    id: repo.name,
    title: repo.name,
    icon: cfg.icon ?? FALLBACK_ICON,
    description: cfg.description ?? repo.description ?? '',
    tags: cfg.tags ?? (repo.language ? [repo.language] : []),
    url: repo.url,
    pinned: cfg.pinned ?? false,
    order: cfg.pinned ? cfg.order ?? UNPINNED_ORDER : UNPINNED_ORDER,
    date: new Date(repo.updatedAt),
    source: 'auto',
    hasDetailPage: false,
  };
}

function sortProjects(projects: UnifiedProject[]): UnifiedProject[] {
  return [...projects].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.pinned && b.pinned && a.order !== b.order) return a.order - b.order;
    return b.date.valueOf() - a.date.valueOf();
  });
}

export async function getListedManualIds(): Promise<Set<string>> {
  return listedManualIds(parseConfig(configRaw));
}

export async function getUnifiedProjects(): Promise<UnifiedProject[]> {
  const config = parseConfig(configRaw);
  const manualConfigById = new Map(config.manual.map((m) => [m.id, m]));
  const autoConfigByRepo = new Map(config.auto.map((a) => [a.repo, a]));

  const allManualEntries = await getCollection('projects');
  const unconfiguredManual = allManualEntries.filter((entry) => !manualConfigById.has(entry.id));
  if (unconfiguredManual.length > 0) {
    console.warn(
      `[projects] ${unconfiguredManual.length} manual project(s) not in src/data/projects.config.yaml: ${unconfiguredManual.map((e) => e.id).join(', ')}`
    );
  }

  const manualProjects = allManualEntries
    .filter((entry) => manualConfigById.get(entry.id)?.include)
    .map((entry) => mapManualEntry(entry.id, entry.data, manualConfigById.get(entry.id)!));

  const allRepos = await fetchAllPublicRepos();
  const unconfigured = allRepos.filter((repo) => !autoConfigByRepo.has(repo.name));
  if (unconfigured.length > 0) {
    console.warn(
      `[projects] ${unconfigured.length} public repo(s) not in src/data/projects.config.yaml: ${unconfigured.map((r) => r.name).join(', ')}`
    );
  }

  const autoProjects = allRepos
    .filter((repo) => autoConfigByRepo.get(repo.name)?.include)
    .map((repo) => mapAutoRepo(repo, autoConfigByRepo.get(repo.name)!));

  return sortProjects([...manualProjects, ...autoProjects]);
}
