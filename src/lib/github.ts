const GITHUB_USER = "mtanneer";

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

export async function fetchGithubStats(): Promise<GithubStats> {
  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${GITHUB_USER}`),
    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=6`),
  ]);

  const user = await userRes.json();
  const repos = await reposRes.json();

  return {
    publicRepos: user.public_repos,
    followers: user.followers,
    recentRepos: repos
      .filter((r: any) => !r.fork)
      .slice(0, 5)
      .map((r: any) => ({
        name: r.name,
        url: r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        updatedAt: r.updated_at,
      })),
  };
}
