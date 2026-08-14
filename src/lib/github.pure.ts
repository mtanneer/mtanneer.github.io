const GITHUB_USER = 'mtanneer';

export interface DocsRepo {
  name: string;
  url: string;
}

export function mapDocsRepos(repos: unknown): DocsRepo[] {
  if (!Array.isArray(repos)) return [];

  return repos
    .filter((r: any) => r.has_pages && !r.fork && r.name !== `${GITHUB_USER}.github.io`)
    .map((r: any) => ({
      name: r.name,
      url: `https://${GITHUB_USER}.github.io/${r.name}/`,
    }))
    .sort((a: DocsRepo, b: DocsRepo) => a.name.localeCompare(b.name));
}

export interface PublicRepo {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  updatedAt: string;
}

export function mapPublicRepos(repos: unknown): PublicRepo[] {
  if (!Array.isArray(repos)) return [];

  return repos
    .filter((r: any) => !r.fork)
    .map((r: any) => ({
      name: r.name,
      url: r.html_url,
      description: r.description,
      language: r.language,
      updatedAt: r.updated_at,
    }));
}

export interface RepoStat {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
}

export function mapPinnedRepos(json: any): RepoStat[] {
  const nodes = json?.data?.user?.pinnedItems?.nodes ?? [];

  return nodes.map((r: any) => ({
    name: r.name,
    url: r.url,
    description: r.description,
    language: r.primaryLanguage?.name ?? null,
    stars: r.stargazerCount,
    updatedAt: r.updatedAt,
  }));
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionDay[][];
}

export function sixMonthRange(now = new Date()): { from: string; to: string } {
  const from = new Date(now);
  from.setUTCMonth(from.getUTCMonth() - 6);
  return { from: from.toISOString(), to: now.toISOString() };
}

const CONTRIBUTION_LEVEL_MAP: Record<string, ContributionDay['level']> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export function mapContributionCalendar(json: any): ContributionCalendar | null {
  const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) return null;

  return {
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks.map((w: any) =>
      w.contributionDays.map((d: any) => ({
        date: d.date,
        count: d.contributionCount,
        level: CONTRIBUTION_LEVEL_MAP[d.contributionLevel] ?? 0,
      }))
    ),
  };
}

export interface GithubStats {
  publicRepos: number;
  followers: number;
  recentRepos: RepoStat[];
}

export function mapGithubStats(user: any, repos: unknown): GithubStats {
  return {
    publicRepos: user.public_repos ?? 0,
    followers: user.followers ?? 0,
    recentRepos: Array.isArray(repos)
      ? repos
          .filter((r: any) => !r.fork)
          .slice(0, 5)
          .map((r: any) => ({
            name: r.name,
            url: r.html_url,
            description: r.description,
            language: r.language,
            stars: r.stargazers_count,
            updatedAt: r.updated_at,
          }))
      : [],
  };
}
