const GITHUB_USER = "mtanneer";

function authHeaders(): HeadersInit {
  const token = import.meta.env.GITHUB_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function graphql(query: string, variables: Record<string, unknown>): Promise<any> {
  const token = import.meta.env.GITHUB_TOKEN;
  if (!token) return null;

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  return res.json();
}

export interface RepoStat {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
}

export interface GithubStats {
  publicRepos: number;
  followers: number;
  recentRepos: RepoStat[];
}

export interface DocsRepo {
  name: string;
  url: string;
}

export async function fetchDocsRepos(): Promise<DocsRepo[]> {
  const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`, {
    headers: authHeaders(),
  });
  const repos = await res.json();
  if (!Array.isArray(repos)) return [];

  return repos
    .filter((r: any) => r.has_pages && !r.fork && r.name !== `${GITHUB_USER}.github.io`)
    .map((r: any) => ({
      name: r.name,
      url: `https://${GITHUB_USER}.github.io/${r.name}/`,
    }))
    .sort((a: DocsRepo, b: DocsRepo) => a.name.localeCompare(b.name));
}

export async function fetchPinnedRepos(): Promise<RepoStat[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: [REPOSITORY]) {
          nodes {
            ... on Repository {
              name
              url
              description
              primaryLanguage { name }
              stargazerCount
              updatedAt
            }
          }
        }
      }
    }
  `;

  const json = await graphql(query, { login: GITHUB_USER });
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

export async function fetchContributionCalendar(): Promise<ContributionCalendar | null> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;

  const json = await graphql(query, { login: GITHUB_USER });
  const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) return null;

  const levelMap: Record<string, ContributionDay['level']> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };

  return {
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks.map((w: any) =>
      w.contributionDays.map((d: any) => ({
        date: d.date,
        count: d.contributionCount,
        level: levelMap[d.contributionLevel] ?? 0,
      }))
    ),
  };
}

export async function fetchGithubStats(): Promise<GithubStats> {
  const headers = authHeaders();
  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${GITHUB_USER}`, { headers }),
    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=6`, { headers }),
  ]);

  const user = await userRes.json();
  const repos = await reposRes.json();

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
