import { getCollection } from 'astro:content';
import { SITE, NAV } from './site';

export type NodeKind = 'page' | 'project' | 'external';

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  url: string;
  external?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function buildSiteGraph(): Promise<GraphData> {
  const projects = await getCollection('projects');

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenExternal = new Map<string, string>();

  const addExternal = (url: string, label: string): string => {
    const existing = seenExternal.get(url);
    if (existing) return existing;
    const id = `ext:${label}`;
    nodes.push({ id, label, kind: 'external', url, external: true });
    seenExternal.set(url, id);
    return id;
  };

  for (const item of NAV) {
    nodes.push({ id: `page:${item.href}`, label: item.label, kind: 'page', url: item.href });
  }
  edges.push({ source: 'page:/', target: 'page:/projects/' });
  edges.push({ source: 'page:/', target: 'page:/about/' });
  edges.push({ source: 'page:/', target: 'page:/contact/' });

  for (const project of projects) {
    const nodeId = `project:${project.id}`;
    nodes.push({
      id: nodeId,
      label: project.data.title,
      kind: 'project',
      url: `/projects/${project.id}/`,
    });
    edges.push({ source: 'page:/projects/', target: nodeId });

    if (project.data.repoUrl) {
      const repoId = addExternal(project.data.repoUrl, project.data.title + ' repo');
      edges.push({ source: nodeId, target: repoId });
    }
  }

  const githubId = addExternal(SITE.github, 'GitHub');
  const linkedinId = addExternal(SITE.linkedin, 'LinkedIn');
  const emailId = addExternal(`mailto:${SITE.email}`, 'Email');
  const purdueId = addExternal('https://engineering.purdue.edu/ECE', 'Purdue ECE');

  edges.push({ source: 'page:/about/', target: githubId });
  edges.push({ source: 'page:/about/', target: linkedinId });
  edges.push({ source: 'page:/about/', target: emailId });
  edges.push({ source: 'page:/about/', target: purdueId });
  edges.push({ source: 'page:/contact/', target: githubId });
  edges.push({ source: 'page:/contact/', target: linkedinId });
  edges.push({ source: 'page:/contact/', target: emailId });

  return { nodes, edges };
}
