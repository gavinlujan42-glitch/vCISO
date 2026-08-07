# AEGIS Evidence and Domain Model

AEGIS connects executive decisions to source evidence through two primary chains.

## Engineering and contract assurance

`Contract -> Statement of Work -> Milestone -> Epic/Story -> Repository -> Commit -> Pull Request -> Review -> Build -> Test -> Deployment -> Acceptance -> Invoice`

Core rule: an invoice recommendation is never based on reported effort alone. Accepted milestones and linked delivery evidence must be present, and the underlying records remain available for human review.

## Security and governance assurance

`Tenant -> Business Unit -> Security Officer -> Asset/Application -> Finding -> Remediation -> Evidence -> Verification -> Risk -> Executive Score`

Core rule: every business-unit posture score must expose the inputs and rationale used to produce it. Violet represents incomplete evidence/governance rather than an inferred security state.

## Cross-domain executive intelligence

The Executive Attention Queue receives normalized signals from security, delivery, contracts, finance, and governance. Each signal contains:

- tenant identity
- category
- severity
- confidence
- age
- optional financial exposure
- overdue state
- evidence references
- recommended human action

Priority is deterministic and explainable. AI may enrich narrative summaries but does not silently change the underlying deterministic score.

## Tenant and ownership boundaries

Every persisted aggregate will include a tenant identifier. Business-unit scoped operators may act only within assigned units unless a tenant-wide role explicitly grants broader scope.

## Planned persistence model

Initial production persistence will use PostgreSQL with immutable identifiers, foreign keys, row-level tenant enforcement, append-only audit events, and migration-controlled schemas. Event ingestion from external systems will be idempotent using source-system identifiers and normalized event types.
