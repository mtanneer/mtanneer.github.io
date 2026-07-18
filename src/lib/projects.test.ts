import { describe, it, expect } from 'vitest';
import {
  parseConfig,
  listedManualIds,
  unconfiguredManualIds,
  unconfiguredRepoNames,
  mapManualEntry,
  mapAutoRepo,
  sortProjects,
  UNPINNED_ORDER,
  FALLBACK_ICON,
  type ProjectsConfig,
  type UnifiedProject,
} from './projects.pure';
import type { PublicRepo } from './github';

describe('parseConfig', () => {
  it('defaults missing auto/manual blocks to empty arrays', () => {
    expect(parseConfig('')).toEqual({ auto: [], manual: [] });
  });

  it('parses auto and manual entries', () => {
    const config = parseConfig(`
auto:
  - repo: foo
    include: true
manual:
  - id: bar
    include: true
`);
    expect(config.auto).toEqual([{ repo: 'foo', include: true }]);
    expect(config.manual).toEqual([{ id: 'bar', include: true }]);
  });

  it('last entry wins on duplicate keys, since callers build a Map by that key', () => {
    const config = parseConfig(`
manual:
  - id: dup
    include: true
  - id: dup
    include: false
`);
    const ids = listedManualIds(config);
    expect(ids.has('dup')).toBe(false);
  });
});

describe('listedManualIds', () => {
  it('excludes manual entries with include: false', () => {
    const config: ProjectsConfig = {
      auto: [],
      manual: [
        { id: 'shown', include: true },
        { id: 'hidden', include: false },
      ],
    };
    expect(listedManualIds(config)).toEqual(new Set(['shown']));
  });

  it('is empty when manual config is empty, even if .md files exist', () => {
    const config: ProjectsConfig = { auto: [], manual: [] };
    expect(listedManualIds(config)).toEqual(new Set());
  });
});

describe('unconfiguredManualIds', () => {
  it('flags a .md entry with no config row at all', () => {
    const config: ProjectsConfig = { auto: [], manual: [{ id: 'known', include: true }] };
    expect(unconfiguredManualIds(config, ['known', 'mystery'])).toEqual(['mystery']);
  });

  it('does not flag an entry that is configured but include: false', () => {
    const config: ProjectsConfig = { auto: [], manual: [{ id: 'staged', include: false }] };
    expect(unconfiguredManualIds(config, ['staged'])).toEqual([]);
  });
});

describe('unconfiguredRepoNames', () => {
  it('flags a public repo with no auto: config row', () => {
    const config: ProjectsConfig = { auto: [{ repo: 'known', include: true }], manual: [] };
    expect(unconfiguredRepoNames(config, ['known', 'new-repo'])).toEqual(['new-repo']);
  });
});

describe('mapManualEntry', () => {
  const data = {
    title: 'Test Project',
    icon: '◇',
    description: 'desc',
    tags: ['a', 'b'],
    date: new Date('2024-01-01'),
  };

  it('maps pinned entry with explicit order', () => {
    const project = mapManualEntry('test-id', data, { id: 'test-id', include: true, pinned: true, order: 3 });
    expect(project).toMatchObject({
      id: 'test-id',
      title: 'Test Project',
      url: '/projects/test-id/',
      pinned: true,
      order: 3,
      source: 'manual',
      hasDetailPage: true,
    });
  });

  it('defaults unpinned entries to UNPINNED_ORDER regardless of a stray order field', () => {
    const project = mapManualEntry('test-id', data, { id: 'test-id', include: true, pinned: false, order: 5 });
    expect(project.order).toBe(UNPINNED_ORDER);
  });

  it('defaults pinned entry with no order to UNPINNED_ORDER', () => {
    const project = mapManualEntry('test-id', data, { id: 'test-id', include: true, pinned: true });
    expect(project.order).toBe(UNPINNED_ORDER);
  });
});

describe('mapAutoRepo', () => {
  const repo: PublicRepo = {
    name: 'my-repo',
    url: 'https://github.com/user/my-repo',
    description: 'from github',
    language: 'TypeScript',
    updatedAt: '2024-06-01T00:00:00Z',
  };

  it('falls back to GitHub API data when no overrides given', () => {
    const project = mapAutoRepo(repo, { repo: 'my-repo', include: true });
    expect(project).toMatchObject({
      id: 'my-repo',
      title: 'my-repo',
      icon: FALLBACK_ICON,
      description: 'from github',
      tags: ['TypeScript'],
      url: 'https://github.com/user/my-repo',
      source: 'auto',
      hasDetailPage: false,
    });
  });

  it('config overrides win over GitHub API data', () => {
    const project = mapAutoRepo(repo, {
      repo: 'my-repo',
      include: true,
      description: 'custom desc',
      tags: ['Custom'],
      icon: '⚙',
    });
    expect(project.description).toBe('custom desc');
    expect(project.tags).toEqual(['Custom']);
    expect(project.icon).toBe('⚙');
  });

  it('empty tags/description fall back to empty when GitHub has none either', () => {
    const bareRepo: PublicRepo = { ...repo, description: null, language: null };
    const project = mapAutoRepo(bareRepo, { repo: 'my-repo', include: true });
    expect(project.description).toBe('');
    expect(project.tags).toEqual([]);
  });
});

describe('sortProjects', () => {
  function project(overrides: Partial<UnifiedProject>): UnifiedProject {
    return {
      id: 'x',
      title: 'x',
      description: '',
      tags: [],
      url: '/x/',
      pinned: false,
      order: UNPINNED_ORDER,
      date: new Date('2024-01-01'),
      source: 'manual',
      hasDetailPage: true,
      ...overrides,
    };
  }

  it('puts pinned projects before unpinned, regardless of date', () => {
    const older = project({ id: 'pinned-old', pinned: true, order: 0, date: new Date('2020-01-01') });
    const newer = project({ id: 'unpinned-new', pinned: false, date: new Date('2024-01-01') });
    expect(sortProjects([newer, older]).map((p) => p.id)).toEqual(['pinned-old', 'unpinned-new']);
  });

  it('orders pinned projects by order ascending', () => {
    const second = project({ id: 'second', pinned: true, order: 2 });
    const first = project({ id: 'first', pinned: true, order: 1 });
    expect(sortProjects([second, first]).map((p) => p.id)).toEqual(['first', 'second']);
  });

  it('orders unpinned projects by date descending', () => {
    const older = project({ id: 'older', date: new Date('2020-01-01') });
    const newer = project({ id: 'newer', date: new Date('2024-01-01') });
    expect(sortProjects([older, newer]).map((p) => p.id)).toEqual(['newer', 'older']);
  });

  it('does not mutate the input array', () => {
    const input = [project({ id: 'b', date: new Date('2020-01-01') }), project({ id: 'a', date: new Date('2024-01-01') })];
    const original = [...input];
    sortProjects(input);
    expect(input).toEqual(original);
  });
});
