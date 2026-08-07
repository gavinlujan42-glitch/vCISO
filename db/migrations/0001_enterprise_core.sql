BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  external_subject text NOT NULL,
  display_name text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, external_subject)
);

CREATE TABLE business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE user_roles (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  business_unit_id uuid REFERENCES business_units(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id, role, business_unit_id)
);

CREATE TABLE remediation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  business_unit_id uuid NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical','high','medium','low')),
  status text NOT NULL CHECK (status IN ('open','in_progress','risk_accepted','resolved','verified')),
  source text NOT NULL,
  discovered_at timestamptz NOT NULL,
  due_at timestamptz NOT NULL,
  verified_at timestamptz,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX remediation_tenant_unit_due_idx ON remediation_items(tenant_id, business_unit_id, due_at);

CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  name text NOT NULL,
  ceiling_cents bigint NOT NULL CHECK (ceiling_cents >= 0),
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  acceptance_state text NOT NULL,
  work_item_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES contracts(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  state text NOT NULL,
  submitted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoice_milestones (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  milestone_id uuid NOT NULL REFERENCES milestones(id),
  PRIMARY KEY (tenant_id, invoice_id, milestone_id)
);

CREATE TABLE engineering_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_system text NOT NULL,
  source_event_id text NOT NULL,
  repository text NOT NULL,
  actor text NOT NULL,
  occurred_at timestamptz NOT NULL,
  event_type text NOT NULL,
  work_item_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, source_system, source_event_id)
);
CREATE INDEX engineering_event_tenant_repo_time_idx ON engineering_events(tenant_id, repository, occurred_at DESC);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  request_id text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX audit_event_tenant_time_idx ON audit_events(tenant_id, occurred_at DESC);

COMMIT;
