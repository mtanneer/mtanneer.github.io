import { load } from 'js-yaml';
import type { PublicRepo } from './github';

export interface AutoConfigEntry {
  repo: string;
  include: boolean;
  pinned?: boolean;
  order?: number;
  description?: string;
  tags?: string[];
  icon?: string;
}

export interface ManualConfigEntry {
  id: string;
  include: boolean;
  pinned?: boolean;
  order?: number;
}

export interface ProjectsConfig {
  auto: AutoConfigEntry[];
  manual: ManualConfigEntry[];
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

export interface ManualEntryData {
  title: string;
  icon?: string;
  description: string;
  tags: string[];
  date: Date;
}

export const UNPINNED_ORDER = Number.MAX_SAFE_INTEGER;
export const FALLBACK_ICON = '◇';

// Parse raw yaml text into a config object. Duplicate keys (same `repo` or
// `id` appearing twice) resolve last-wins, since callers build a Map keyed
// by that field.
export function parseConfig(raw: string): ProjectsConfig {
  const parsed = raw.trim() === '' ? undefined : (load(raw) as Partial<ProjectsConfig> | undefined);
  return { auto: parsed?.auto ?? [], manual: parsed?.manual ?? [] };
}

// Which manual entries' `id`s are configured with include: true. Duplicate
// `id`s resolve last-wins (matches the Map-based lookup getUnifiedProjects
// uses), not "any true entry wins".
export function listedManualIds(config: ProjectsConfig): Set<string> {
  const byId = new Map(config.manual.map((m) => [m.id, m]));
  return new Set([...byId.values()].filter((m) => m.include).map((m) => m.id));
}

// Manual .md entries with no matching config row at all (not simply
// include: false — genuinely absent, the case the build-time warning flags).
export function unconfiguredManualIds(config: ProjectsConfig, entryIds: string[]): string[] {
  const configuredIds = new Set(config.manual.map((m) => m.id));
  return entryIds.filter((id) => !configuredIds.has(id));
}

// Public repo names with no matching `auto:` config row at all.
export function unconfiguredRepoNames(config: ProjectsConfig, repoNames: string[]): string[] {
  const configuredNames = new Set(config.auto.map((a) => a.repo));
  return repoNames.filter((name) => !configuredNames.has(name));
}

// Fold one manual config row + its collection entry data into the unified
// shape. Caller must have already checked `cfg.include` is true.
export function mapManualEntry(id: string, data: ManualEntryData, cfg: ManualConfigEntry): UnifiedProject {
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

// Fold one auto config row + its GitHub repo data into the unified shape,
// applying config overrides over API data. Caller must have already checked
// `cfg.include` is true.
export function mapAutoRepo(repo: PublicRepo, cfg: AutoConfigEntry): UnifiedProject {
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

// Pinned first (by order asc), then everyone else by date desc.
export function sortProjects(projects: UnifiedProject[]): UnifiedProject[] {
  return [...projects].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.pinned && b.pinned && a.order !== b.order) return a.order - b.order;
    return b.date.valueOf() - a.date.valueOf();
  });
}
