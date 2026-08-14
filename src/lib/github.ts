import {
  mapDocsRepos,
  mapPublicRepos,
  mapPinnedRepos,
  mapContributionCalendar,
  mapGithubStats,
  sixMonthRange,
  type DocsRepo,
  type PublicRepo,
  type RepoStat,
  type ContributionCalendar,
  type GithubStats,
} from './github.pure';

export type { DocsRepo, PublicRepo, RepoStat, ContributionCalendar, ContributionDay, GithubStats } from './github.pure';
export { sixMonthRange } from './github.pure';

const GITHUB_USER = 'mtanneer';

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

export async function fetchDocsRepos(): Promise<DocsRepo[]> {
  const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`, {
    headers: authHeaders(),
  });
  return mapDocsRepos(await res.json());
}

export async function fetchAllPublicRepos(): Promise<PublicRepo[]> {
  const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`, {
    headers: authHeaders(),
  });
  return mapPublicRepos(await res.json());
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
  return mapPinnedRepos(json);
}

export async function fetchContributionCalendar(): Promise<ContributionCalendar | null> {
  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
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

  const { from, to } = sixMonthRange();

  const json = await graphql(query, { login: GITHUB_USER, from, to });
  return mapContributionCalendar(json);
}

export async function fetchGithubStats(): Promise<GithubStats> {
  const headers = authHeaders();
  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${GITHUB_USER}`, { headers }),
    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=6`, { headers }),
  ]);

  const user = await userRes.json();
  const repos = await reposRes.json();

  return mapGithubStats(user, repos);
}
