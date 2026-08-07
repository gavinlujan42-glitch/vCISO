# AEGIS Agentic Software Factory

## Purpose
AEGIS models an AI-native software company as accountable departments, bounded agents, human counterparts, artifacts, evidence, and approval gates. Agents perform work. Humans remain accountable for consequential outputs and decisions.

## Operating model

### Executive Governance
- AI Executive Advisor -> Human Executive Sponsor
- AI Chief of Staff -> Human Program Manager
- AI Portfolio Manager -> Human PMO / Program Director

### Product
- AI Product Manager -> Human Product Owner
- AI Business Analyst -> Human Product Owner / Business Lead
- AI UX / Documentation agents -> Human Product / Knowledge leads

### Architecture
- AI Solution Architect -> Human Enterprise Architect
- AI Data / Cloud / Security architecture agents -> Human architecture and security authorities

### Engineering
- AI Backend / Frontend / Data / Integration engineers -> Human Engineering Manager / Lead Engineer
- Agents may produce branches, code, tests, ADR proposals, and implementation notes within capability and autonomy policy.

### Quality
- AI QA agents -> Human QA Lead
- Agents generate and execute tests, classify failures, and produce evidence. Human QA authorities approve exceptions and acceptance criteria changes.

### Security
- AI Security Reviewer -> Human Security Officer / CISO delegate
- Agents perform static analysis, dependency review, threat-model checks, and evidence collection. Risk acceptance remains human.

### Operations
- AI Release Manager / Platform agents -> Human Release Authority
- Production deployment requires an explicit human approval gate unless a future tenant policy defines a separately approved low-risk automated deployment class.

### Knowledge
- AI Technical Writer / Knowledge agents -> Human Knowledge Manager
- Every release should emit architecture notes, release notes, test evidence, security evidence, and operating guidance.

## Non-negotiable controls
1. Every enabled agent has a named accountable human.
2. Agent capabilities are explicit allow-lists.
3. Agent autonomy is bounded by policy.
4. Consequential gates are human decisions with rationale and evidence.
5. AI cannot approve its own work.
6. Every work item retains inputs, outputs, agent identity, human accountability, and decision lineage.
7. Tenant boundaries apply to agents, work, artifacts, approvals, and evidence.
8. Production changes, risk acceptance, contract acceptance, and invoice approval are never inferred from activity metrics alone.

## Core flow
Customer request -> Interview / requirements -> Product acceptance -> Architecture proposal -> Human architecture approval -> Agent implementation -> AI QA / security analysis -> Human code / security approval -> Product acceptance -> Human merge approval -> Human release approval -> Deployment -> Evidence / audit record.

## Accountability principle
AI responsibility is execution quality within its assigned scope. Human responsibility is authorization, acceptance, exception handling, and organizational accountability. AEGIS must make both visible in the same evidence graph.

## Executive metrics for the factory
- Agent work acceptance rate
- First-pass acceptance
- Human review turnaround
- Rework rate
- Defect escape rate
- Security finding rate
- Approval-gate aging
- Cost per accepted deliverable
- Human-to-agent leverage ratio
- Automation savings with confidence interval
- Agent exception / policy-denial rate

No single metric is an employee or agent performance rating. Metrics are contextual evidence for management decisions.
