import type { EngineeringEvent } from '../domain/engineering';

export interface GitHubPullRequestRecord {
  repoFullName: string;
  number: number;
  title: string;
  authorLogin: string;
  state: 'open' | 'closed' | 'merged';
  createdAt: string;
  mergedAt?: string;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  reviewCount?: number;
  checksPassed?: boolean;
}

export interface GitHubIssueRecord {
  repoFullName: string;
  number: number;
  title: string;
  state: 'open' | 'closed';
  authorLogin: string;
  createdAt: string;
  closedAt?: string;
}

export interface GitHubDeploymentRecord {
  repoFullName: string;
  deploymentId: string;
  environment: string;
  status: 'success' | 'failure' | 'in_progress';
  createdAt: string;
  actorLogin?: string;
}

export function normalizePullRequest(tenantId: string, projectId: string, pr: GitHubPullRequestRecord): EngineeringEvent[] {
  const events: EngineeringEvent[] = [{
    id: `github:pr:${pr.repoFullName}:${pr.number}:opened`,
    tenantId,
    projectId,
    source: 'github',
    kind: 'pull_request',
    externalId: `${pr.repoFullName}#${pr.number}`,
    actorExternalId: pr.authorLogin,
    occurredAt: pr.createdAt,
    evidence: {
      title: pr.title,
      repo: pr.repoFullName,
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      changedFiles: pr.changedFiles ?? 0,
      reviewCount: pr.reviewCount ?? 0,
      checksPassed: pr.checksPassed ?? null,
      state: pr.state,
    },
  }];

  if (pr.mergedAt) {
    events.push({
      id: `github:pr:${pr.repoFullName}:${pr.number}:merged`,
      tenantId,
      projectId,
      source: 'github',
      kind: 'merge',
      externalId: `${pr.repoFullName}#${pr.number}`,
      actorExternalId: pr.authorLogin,
      occurredAt: pr.mergedAt,
      evidence: { repo: pr.repoFullName, checksPassed: pr.checksPassed ?? null },
    });
  }
  return events;
}

export function normalizeIssue(tenantId: string, projectId: string, issue: GitHubIssueRecord): EngineeringEvent {
  return {
    id: `github:issue:${issue.repoFullName}:${issue.number}:${issue.state}`,
    tenantId,
    projectId,
    source: 'github',
    kind: 'work_item',
    externalId: `${issue.repoFullName}#${issue.number}`,
    actorExternalId: issue.authorLogin,
    occurredAt: issue.closedAt ?? issue.createdAt,
    evidence: { title: issue.title, repo: issue.repoFullName, state: issue.state },
  };
}

export function normalizeDeployment(tenantId: string, projectId: string, deployment: GitHubDeploymentRecord): EngineeringEvent {
  return {
    id: `github:deployment:${deployment.repoFullName}:${deployment.deploymentId}:${deployment.status}`,
    tenantId,
    projectId,
    source: 'github',
    kind: deployment.status === 'failure' ? 'deployment_failure' : 'deployment',
    externalId: deployment.deploymentId,
    ...(deployment.actorLogin ? { actorExternalId: deployment.actorLogin } : {}),
    occurredAt: deployment.createdAt,
    evidence: { repo: deployment.repoFullName, environment: deployment.environment, status: deployment.status },
  };
}
