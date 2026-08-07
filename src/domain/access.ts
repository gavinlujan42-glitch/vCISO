export type TenantId = string;
export type UserId = string;
export type BusinessUnitId = string;

export type Role =
  | 'platform_admin'
  | 'executive'
  | 'cio'
  | 'ciso'
  | 'business_unit_security_officer'
  | 'deputy_security_officer'
  | 'project_manager'
  | 'contract_manager'
  | 'developer'
  | 'auditor'
  | 'viewer';

export type Permission =
  | 'tenant:admin'
  | 'executive:read'
  | 'portfolio:write'
  | 'security:write'
  | 'security:remediate'
  | 'contracts:write'
  | 'engineering:read'
  | 'engineering:write'
  | 'audit:read';

export interface Principal {
  userId: UserId;
  tenantId: TenantId;
  roles: Role[];
  businessUnitIds: BusinessUnitId[];
}

const permissionsByRole: Record<Role, Permission[]> = {
  platform_admin: ['tenant:admin','executive:read','portfolio:write','security:write','security:remediate','contracts:write','engineering:read','engineering:write','audit:read'],
  executive: ['executive:read','engineering:read','audit:read'],
  cio: ['executive:read','portfolio:write','contracts:write','engineering:read','engineering:write','audit:read'],
  ciso: ['executive:read','security:write','security:remediate','engineering:read','audit:read'],
  business_unit_security_officer: ['security:write','security:remediate','audit:read'],
  deputy_security_officer: ['security:remediate','audit:read'],
  project_manager: ['portfolio:write','engineering:read','engineering:write'],
  contract_manager: ['contracts:write','engineering:read','audit:read'],
  developer: ['engineering:read','engineering:write'],
  auditor: ['executive:read','engineering:read','audit:read'],
  viewer: ['executive:read']
};

export function hasPermission(principal: Principal, permission: Permission): boolean {
  return principal.roles.some(role => permissionsByRole[role].includes(permission));
}

export function assertTenantBoundary(principal: Principal, resourceTenantId: TenantId): void {
  if (principal.tenantId !== resourceTenantId) {
    throw new Error('TENANT_BOUNDARY_VIOLATION');
  }
}

export function canManageBusinessUnit(principal: Principal, businessUnitId: BusinessUnitId): boolean {
  if (principal.roles.includes('platform_admin') || principal.roles.includes('ciso')) return true;
  return principal.businessUnitIds.includes(businessUnitId) &&
    (principal.roles.includes('business_unit_security_officer') || principal.roles.includes('deputy_security_officer'));
}
