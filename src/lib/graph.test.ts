import { describe, it, expect, vi } from 'vitest';

const mockProjects: any[] = [];

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => mockProjects),
}));

const { buildSiteGraph } = await import('./graph');

describe('buildSiteGraph', () => {
  it('always includes nav pages, their edges from home, and the fixed about/contact external links', async () => {
    mockProjects.length = 0;
    const graph = await buildSiteGraph();

    const pageIds = graph.nodes.filter((n) => n.kind === 'page').map((n) => n.id);
    expect(pageIds).toEqual(['page:/', 'page:/projects/', 'page:/about/', 'page:/contact/']);

    expect(graph.edges).toContainEqual({ source: 'page:/', target: 'page:/projects/' });
    expect(graph.edges).toContainEqual({ source: 'page:/', target: 'page:/about/' });
    expect(graph.edges).toContainEqual({ source: 'page:/', target: 'page:/contact/' });

    const externalLabels = graph.nodes.filter((n) => n.kind === 'external').map((n) => n.label);
    expect(externalLabels).toEqual(['GitHub', 'LinkedIn', 'Email', 'Purdue ECE']);
  });

  it('adds a project node and edge from the projects page for each project', async () => {
    mockProjects.length = 0;
    mockProjects.push(
      { id: 'proj-a', data: { title: 'Project A' } },
      { id: 'proj-b', data: { title: 'Project B' } }
    );

    const graph = await buildSiteGraph();
    const projectNodes = graph.nodes.filter((n) => n.kind === 'project');
    expect(projectNodes).toEqual([
      { id: 'project:proj-a', label: 'Project A', kind: 'project', url: '/projects/proj-a/' },
      { id: 'project:proj-b', label: 'Project B', kind: 'project', url: '/projects/proj-b/' },
    ]);

    expect(graph.edges).toContainEqual({ source: 'page:/projects/', target: 'project:proj-a' });
    expect(graph.edges).toContainEqual({ source: 'page:/projects/', target: 'project:proj-b' });
  });

  it('adds an external repo node and edge only for projects with a repoUrl', async () => {
    mockProjects.length = 0;
    mockProjects.push(
      { id: 'has-repo', data: { title: 'Has Repo', repoUrl: 'https://github.com/u/has-repo' } },
      { id: 'no-repo', data: { title: 'No Repo' } }
    );

    const graph = await buildSiteGraph();
    const repoNode = graph.nodes.find((n) => n.id === 'ext:Has Repo repo');
    expect(repoNode).toMatchObject({ kind: 'external', url: 'https://github.com/u/has-repo', external: true });
    expect(graph.edges).toContainEqual({ source: 'project:has-repo', target: 'ext:Has Repo repo' });

    expect(graph.nodes.find((n) => n.id === 'ext:No Repo repo')).toBeUndefined();
  });

  it('dedupes external nodes that share the same URL', async () => {
    mockProjects.length = 0;
    mockProjects.push(
      { id: 'proj-a', data: { title: 'Shared', repoUrl: 'https://github.com/u/shared' } },
      { id: 'proj-b', data: { title: 'Shared', repoUrl: 'https://github.com/u/shared' } }
    );

    const graph = await buildSiteGraph();
    const sharedNodes = graph.nodes.filter((n) => n.url === 'https://github.com/u/shared');
    expect(sharedNodes).toHaveLength(1);
    expect(graph.edges).toContainEqual({ source: 'project:proj-a', target: 'ext:Shared repo' });
    expect(graph.edges).toContainEqual({ source: 'project:proj-b', target: 'ext:Shared repo' });
  });
});
