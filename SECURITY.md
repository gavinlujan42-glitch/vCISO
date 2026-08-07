# AEGIS Security Model

AEGIS is designed as a multi-tenant executive operations platform handling security posture, engineering evidence, contracts, invoices, and governance data. Security controls are product architecture, not deployment garnish.

## Security principles

1. **Tenant isolation by default** — every protected resource is tenant-scoped and every authorization path must enforce the tenant boundary.
2. **Least privilege** — RBAC grants only the permissions required by the current role and business-unit scope.
3. **Human authorization for consequential actions** — AI may recommend, summarize, score, and prioritize; it may not autonomously approve invoices, accept risk, close findings, or alter privileged access.
4. **Explainable scoring** — risk, delivery, vendor, and executive scores must expose contributing evidence and policy thresholds.
5. **Evidence integrity** — normalized source references preserve traceability back to source systems such as GitHub, scanners, CI/CD, ticketing, and contract records.
6. **Auditability** — security, governance, contract, and access decisions must produce append-only audit events in the production design.
7. **Data minimization** — developer intelligence measures delivery evidence and outcomes. Webcam, keystroke, mouse movement, and passive presence surveillance are outside product scope.

## Identity and authorization target

- OIDC/SAML federation for enterprise identity providers
- MFA enforcement delegated to or asserted by the identity provider
- Tenant-scoped roles plus business-unit scope
- Short-lived sessions/tokens
- Explicit service identities for integrations
- Secrets stored outside source code

## Production release gates

A production release must not proceed with known unresolved critical authorization bypasses, tenant-isolation failures, exposed secrets, failing security tests, or unverifiable schema migrations.

## Vulnerability disclosure

Until a dedicated security contact is configured, do not place sensitive vulnerability details in public GitHub issues. Use the repository owner's private contact channel or GitHub private vulnerability reporting when enabled.
