# AEGIS Enterprise Architecture

## Product boundary
AEGIS is an executive operations platform. vCISO, vCIO, DevSure, Contract Assurance, Risk, Compliance, and Executive Intelligence are bounded modules that share a common evidence model.

## Architecture principles
1. Evidence before opinion: every score and AI conclusion must link to source evidence.
2. Human accountability: AI recommends; authorized humans decide and approve.
3. Least privilege: authorization is enforced at API and data layers, not only in the UI.
4. Auditability: material reads, writes, score changes, approvals, and overrides are auditable.
5. Tenant isolation: organization and business-unit boundaries are first-class data constraints.
6. Configurable policy: scoring thresholds, SLAs, risk appetite, and control frameworks are policy data, not hard-coded UI rules.
7. Integration isolation: GitHub, Jira, Linear, scanners, and cloud providers enter through connector interfaces and normalized events.
8. Privacy by design: developer intelligence focuses on project evidence and outcomes, not webcam, keystroke, mouse, or presence surveillance.

## Target layers
- Experience: Executive Command, vCIO, vCISO, DevSure, Contracts, Reports
- Application: use cases, workflow orchestration, authorization, notifications
- Domain: risk, delivery assurance, contract assurance, vendor performance, portfolio health
- Integration: GitHub, Jira/Linear, CI/CD, scanners, cloud, identity
- Data: PostgreSQL operational store, append-only audit/event log, optional graph projection
- Intelligence: rules, anomaly detection, retrieval, AI briefing and explanation services

## Core evidence chain
Contract -> SOW -> Milestone -> Epic -> Story -> Repository -> Commit -> Pull Request -> Review -> Build -> Test -> Deployment -> Acceptance -> Invoice

Security evidence chain:
Business Unit -> Officer -> Asset/Application -> Finding -> Risk -> Control -> Remediation -> Evidence -> Attestation -> Executive Score

## Initial security model
Roles will be additive and scoped: Executive, CIO, CISO, Deputy CISO, Business Unit Security Officer, Engineering Manager, Contract Manager, Auditor, Developer, Read Only.

Production authentication should use OIDC/SAML through an enterprise IdP. Local passwords are not a target-state design.

## Non-functional requirements
- WCAG 2.2 AA target
- OpenTelemetry-compatible observability
- Structured logs with correlation IDs
- Encryption in transit and at rest
- Secrets outside source control
- Automated dependency, SAST, and test gates in CI
- Backup and restore testing
- RPO/RTO defined per deployment tier
- Data retention and legal hold policies configurable by tenant

## Release discipline
Changes flow through feature branches and pull requests. Main is protected in the target state. CI must pass typecheck and tests before merge. Security and architectural changes require designated reviewers.
