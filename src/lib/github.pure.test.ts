import { describe, it, expect } from 'vitest';
import {
  sixMonthRange,
  mapDocsRepos,
  mapPublicRepos,
  mapPinnedRepos,
  mapContributionCalendar,
  mapGithubStats,
} from './github.pure';

describe('sixMonthRange', () => {
  it('spans exactly 6 months ending at now', () => {
    const now = new Date('2026-08-14T12:00:00.000Z');
    expect(sixMonthRange(now)).toEqual({
      from: '2026-02-14T12:00:00.000Z',
      to: '2026-08-14T12:00:00.000Z',
    });
  });

  it('handles month-length underflow (e.g. Mar 31 - 6mo has no day 31)', () => {
    const now = new Date('2026-03-31T00:00:00.000Z');
    const { from } = sixMonthRange(now);
    // JS Date rolls Sep 31 -> Oct 1
    expect(from).toBe('2025-10-01T00:00:00.000Z');
  });
});

describe('mapDocsRepos', () => {
  it('returns empty array for non-array input', () => {
    expect(mapDocsRepos(null)).toEqual([]);
    expect(mapDocsRepos({ message: 'Not Found' })).toEqual([]);
  });

  it('filters to pages-enabled, non-fork repos, excluding the profile repo', () => {
    const repos = [
      { name: 'docs-site', has_pages: true, fork: false },
      { name: 'no-pages', has_pages: false, fork: false },
      { name: 'forked-docs', has_pages: true, fork: true },
      { name: 'mtanneer.github.io', has_pages: true, fork: false },
    ];
    expect(mapDocsRepos(repos)).toEqual([{ name: 'docs-site', url: 'https://mtanneer.github.io/docs-site/' }]);
  });

  it('sorts results alphabetically by name', () => {
    const repos = [
      { name: 'zeta', has_pages: true, fork: false },
      { name: 'alpha', has_pages: true, fork: false },
    ];
    expect(mapDocsRepos(repos).map((r) => r.name)).toEqual(['alpha', 'zeta']);
  });
});

describe('mapPublicRepos', () => {
  it('returns empty array for non-array input', () => {
    expect(mapPublicRepos(undefined)).toEqual([]);
  });

  it('excludes forks and maps fields', () => {
    const repos = [
      { name: 'real', fork: false, html_url: 'https://github.com/u/real', description: 'd', language: 'TS', updated_at: '2024-01-01' },
      { name: 'forked', fork: true, html_url: 'https://github.com/u/forked' },
    ];
    expect(mapPublicRepos(repos)).toEqual([
      { name: 'real', url: 'https://github.com/u/real', description: 'd', language: 'TS', updatedAt: '2024-01-01' },
    ]);
  });
});

describe('mapPinnedRepos', () => {
  it('returns empty array when json has no pinned nodes', () => {
    expect(mapPinnedRepos(null)).toEqual([]);
    expect(mapPinnedRepos({ data: { user: null } })).toEqual([]);
  });

  it('maps pinned repo nodes, defaulting missing language to null', () => {
    const json = {
      data: {
        user: {
          pinnedItems: {
            nodes: [
              { name: 'r', url: 'https://github.com/u/r', description: 'd', primaryLanguage: { name: 'Go' }, stargazerCount: 3, updatedAt: '2024-01-01' },
              { name: 'r2', url: 'https://github.com/u/r2', description: null, primaryLanguage: null, stargazerCount: 0, updatedAt: '2024-01-02' },
            ],
          },
        },
      },
    };
    expect(mapPinnedRepos(json)).toEqual([
      { name: 'r', url: 'https://github.com/u/r', description: 'd', language: 'Go', stars: 3, updatedAt: '2024-01-01' },
      { name: 'r2', url: 'https://github.com/u/r2', description: null, language: null, stars: 0, updatedAt: '2024-01-02' },
    ]);
  });
});

describe('mapContributionCalendar', () => {
  it('returns null when calendar is missing', () => {
    expect(mapContributionCalendar(null)).toBeNull();
    expect(mapContributionCalendar({ data: { user: null } })).toBeNull();
  });

  it('maps contribution levels and defaults unknown levels to 0', () => {
    const json = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: 5,
              weeks: [
                {
                  contributionDays: [
                    { date: '2024-01-01', contributionCount: 0, contributionLevel: 'NONE' },
                    { date: '2024-01-02', contributionCount: 2, contributionLevel: 'THIRD_QUARTILE' },
                    { date: '2024-01-03', contributionCount: 1, contributionLevel: 'UNKNOWN' },
                  ],
                },
              ],
            },
          },
        },
      },
    };
    expect(mapContributionCalendar(json)).toEqual({
      totalContributions: 5,
      weeks: [
        [
          { date: '2024-01-01', count: 0, level: 0 },
          { date: '2024-01-02', count: 2, level: 3 },
          { date: '2024-01-03', count: 1, level: 0 },
        ],
      ],
    });
  });
});

describe('mapGithubStats', () => {
  it('defaults missing user fields to 0 and non-array repos to empty', () => {
    expect(mapGithubStats({}, null)).toEqual({ publicRepos: 0, followers: 0, recentRepos: [] });
  });

  it('excludes forks and caps recent repos at 5', () => {
    const user = { public_repos: 10, followers: 2 };
    const repos = Array.from({ length: 6 }, (_, i) => ({
      name: `r${i}`,
      fork: false,
      html_url: `https://github.com/u/r${i}`,
      description: null,
      language: null,
      stargazers_count: 0,
      updated_at: '2024-01-01',
    }));
    repos.push({ name: 'forked', fork: true, html_url: 'x', description: null, language: null, stargazers_count: 0, updated_at: '2024-01-01' });

    const stats = mapGithubStats(user, repos);
    expect(stats.publicRepos).toBe(10);
    expect(stats.followers).toBe(2);
    expect(stats.recentRepos).toHaveLength(5);
    expect(stats.recentRepos.every((r) => r.name !== 'forked')).toBe(true);
  });
});
