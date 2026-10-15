export type WorkspaceRole = 'admin' | 'manager' | 'employee'

export const WORKSPACE_ROLES: readonly WorkspaceRole[] = ['admin', 'manager', 'employee'] as const

export const ROLE_LEVEL: Record<WorkspaceRole, number> = {
  admin: 3,
  manager: 2,
  employee: 1,
}

export type Capability =
  | 'workspace:create'
  | 'workspace:manage'
  | 'workspace:settings'
  | 'members:invite:manager'
  | 'members:invite:employee'
  | 'members:assign-manager'
  | 'members:remove:manager'
  | 'members:remove:employee'
  | 'members:change-role'
  | 'members:view-invited-by'
  | 'tasks:create'
  | 'tasks:update:any'
  | 'tasks:update:assigned'
  | 'content:create'
  | 'content:review'
  | 'media:upload'
  | 'analytics:view'
  | 'calendar:manage'

export const CAPABILITY_LEVEL: Record<Capability, WorkspaceRole> = {
  'workspace:create': 'admin',
  'workspace:manage': 'admin',
  'workspace:settings': 'admin',
  'members:invite:manager': 'admin',
  'members:invite:employee': 'manager',
  'members:assign-manager': 'admin',
  'members:remove:manager': 'admin',
  'members:remove:employee': 'manager',
  'members:change-role': 'admin',
  'members:view-invited-by': 'manager',
  'tasks:create': 'manager',
  'tasks:update:any': 'manager',
  'tasks:update:assigned': 'employee',
  'content:create': 'manager',
  'content:review': 'manager',
  'media:upload': 'employee',
  'analytics:view': 'manager',
  'calendar:manage': 'manager',
}

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
}

export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  admin: 'Manages workspaces, assigns managers, and controls organization settings',
  manager: 'Runs daily marketing operations, invites employees, and manages content',
  employee: 'Can only see and work on assigned tasks and content',
}

export function isWorkspaceRole(value: string | null | undefined): value is WorkspaceRole {
  return value === 'admin' || value === 'manager' || value === 'employee'
}