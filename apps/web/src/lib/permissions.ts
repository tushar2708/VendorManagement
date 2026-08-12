import rbacConfig from '../config/rbac.json' with { type: 'json' };

type RbacRoles = typeof rbacConfig.roles;
type RoleName = keyof RbacRoles;

interface RbacTierConfig {
  readonly defaultView: string;
  readonly canSwitchView: boolean;
  readonly permissions: Record<string, Record<string, boolean>>;
}

function getTierConfig(role: string, tier: string): RbacTierConfig | null {
  const roleConfig = (rbacConfig.roles as Record<string, { tiers: Record<string, RbacTierConfig> }>)[role];
  if (!roleConfig) return null;
  return roleConfig.tiers[tier] ?? null;
}

export function hasPermission(role: string, tier: string, resource: string, action: string): boolean {
  const config = getTierConfig(role, tier);
  if (!config) return false;
  return config.permissions[resource]?.[action] ?? false;
}

export function getDefaultView(role: string, tier: string): 'executive' | 'leadership' {
  const config = getTierConfig(role, tier);
  if (!config) return 'executive';
  return config.defaultView as 'executive' | 'leadership';
}

export function canSwitchView(role: string, tier: string): boolean {
  const config = getTierConfig(role, tier);
  if (!config) return false;
  return config.canSwitchView;
}

export function canCreate(role: string, tier: string, resource: string): boolean {
  return hasPermission(role, tier, resource, 'create');
}

export function canUpdate(role: string, tier: string, resource: string): boolean {
  return hasPermission(role, tier, resource, 'update');
}

export function canDelete(role: string, tier: string, resource: string): boolean {
  return hasPermission(role, tier, resource, 'delete');
}

export function canDecide(role: string, tier: string): boolean {
  return hasPermission(role, tier, 'approvals', 'decide');
}
