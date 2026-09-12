# AEGIS / vCISO Human-Governed Agentic Security Model

**Doctrine version: 2026-09-12**

## Security principle
**AI supplies velocity. People retain authority.**

AEGIS treats agents as bounded security operators within a policy and evidence plane, not autonomous owners of enterprise authority.

## Authorization ladder
0. Observe telemetry and evidence.
1. Recommend defensive action.
2. Generate firewall, IAM, segmentation, IaC or response changes without applying them.
3. Execute a specific change after authorized human approval.
4. Execute only pre-authorized, reversible, low-blast-radius remediation with complete logging and tested rollback.

## Picarus Sentinel
SOC-01 Picarus Sentinel is a privileged defensive specialist. It must not accept vague assurance as recovery evidence. Where immutable backup/recovery verification is absent, infrastructure risk is elevated. Recommendations must be tied to empirical telemetry, mission impact and applicable controls. Picarus does not self-expand its authority.

## Evidence requirements
Every agent recommendation and consequential action should record identity, policy basis, evidence, retrieved context/provenance, proposed change, approver where required, execution result, rollback state and plain-English rationale. The target is audit-ready evidence aligned to frameworks such as NIST CSF 2.0 and applicable PCI DSS requirements without representing automated output as independent certification.

## Control plane
**Client → Contract → Scope → Policy → Identity → Agent → Evidence → Human Authority → Client**

Security automation exists to compress response time while preserving accountability, reversibility and mission continuity.
