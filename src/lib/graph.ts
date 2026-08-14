import { SITE, NAV } from './site';
import { getUnifiedProjects } from './projects';

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
  const projects = await getUnifiedProjects();

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
    if (project.hasDetailPage) {
      const nodeId = `project:${project.id}`;
      nodes.push({ id: nodeId, label: project.title, kind: 'project', url: project.url });
      edges.push({ source: 'page:/projects/', target: nodeId });
    } else {
      const repoId = addExternal(project.url, project.title);
      edges.push({ source: 'page:/projects/', target: repoId });
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
