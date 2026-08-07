export interface AuditEvent<TBefore = unknown, TAfter = unknown> {
  id: string;
  tenantId: string;
  actorUserId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  occurredAt: string;
  requestId?: string;
  before?: TBefore;
  after?: TAfter;
  metadata: Record<string, string | number | boolean | null>;
}

export interface AuditSink {
  append(event: AuditEvent): Promise<void>;
}

export function buildAuditEvent(input: Omit<AuditEvent, 'occurredAt'> & { occurredAt?: string }): AuditEvent {
  return {
    ...input,
    occurredAt: input.occurredAt ?? new Date().toISOString()
  };
}
