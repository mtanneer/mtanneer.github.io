// Appends stub entries (include: false) to projects.config.yaml for any
// public GitHub repo not yet listed under `auto:`. Run daily in CI; commits
// only happen if something actually changed.
import { readFileSync, writeFileSync } from 'node:fs';
import { load, dump } from 'js-yaml';

const GITHUB_USER = 'mtanneer';
const CONFIG_PATH = new URL('../src/data/projects.config.yaml', import.meta.url);

async function fetchAllPublicRepos() {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const repos = await res.json();
  if (!Array.isArray(repos)) throw new Error(`Unexpected GitHub API response: ${JSON.stringify(repos)}`);
  return repos.filter((r) => !r.fork).map((r) => r.name);
}

const raw = readFileSync(CONFIG_PATH, 'utf-8');
const config = load(raw);
const auto = config.auto ?? [];
const known = new Set(auto.map((a) => a.repo));

const repoNames = await fetchAllPublicRepos();
const newRepos = repoNames.filter((name) => !known.has(name));

if (newRepos.length === 0) {
  console.log('No new public repos to add.');
  process.exit(0);
}

for (const name of newRepos) {
  auto.push({ repo: name, include: false });
}
config.auto = auto;

const header = `# Auto = GitHub repos, pulled live at build time via REST.
# A repo must be listed here with include: true to appear at all.
# New repos are appended here automatically (include: false) by
# scripts/sync-projects-config.mjs — flip to true to publish.
#
# Manual = src/content/projects/*.md entries.
# Inclusion is governed by each file's own frontmatter (status: draft hides it).
# Config's only job here is pin state + order.
`;
writeFileSync(CONFIG_PATH, header + dump(config, { lineWidth: -1 }));
console.log(`Added ${newRepos.length} stub entr${newRepos.length === 1 ? 'y' : 'ies'}: ${newRepos.join(', ')}`);
