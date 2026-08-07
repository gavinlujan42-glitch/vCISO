create table if not exists agent_definitions (
  id text primary key,
  tenant_id text not null,
  name text not null,
  department text not null,
  role text not null,
  capabilities jsonb not null default '[]'::jsonb,
  human_accountable_user_id text not null,
  supervisor_agent_id text null references agent_definitions(id),
  enabled boolean not null default true,
  model_policy_ref text not null,
  max_autonomy text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_definitions_tenant on agent_definitions(tenant_id);
create index if not exists idx_agent_definitions_human on agent_definitions(tenant_id, human_accountable_user_id);

create table if not exists agent_work_items (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  assigned_agent_id text not null references agent_definitions(id),
  accountable_human_user_id text not null,
  parent_work_item_id text null references agent_work_items(id),
  title text not null,
  objective text not null,
  state text not null,
  input_evidence_refs jsonb not null default '[]'::jsonb,
  output_artifact_refs jsonb not null default '[]'::jsonb,
  required_approval_gates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_work_tenant_project on agent_work_items(tenant_id, project_id);
create index if not exists idx_agent_work_accountable_human on agent_work_items(tenant_id, accountable_human_user_id, state);

create table if not exists agent_artifacts (
  id text primary key,
  tenant_id text not null,
  work_item_id text not null references agent_work_items(id),
  produced_by_agent_id text not null references agent_definitions(id),
  accountable_human_user_id text not null,
  kind text not null,
  uri text not null,
  checksum text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_artifacts_work_item on agent_artifacts(tenant_id, work_item_id);

create table if not exists agent_approval_decisions (
  id text primary key,
  tenant_id text not null,
  work_item_id text not null references agent_work_items(id),
  gate text not null,
  human_user_id text not null,
  decision text not null,
  rationale text not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  decided_at timestamptz not null default now()
);

create index if not exists idx_agent_approval_work_item on agent_approval_decisions(tenant_id, work_item_id, gate);

-- Deliberately no agent_actor_id approval column: consequential approvals are human-only by schema contract.
