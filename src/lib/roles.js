// Central role/authorization config for TAF.
//
// This project's Supabase instance is shared with another app whose users
// carry roles in metadata (admin / hr / ceo). TAF recognizes those plus its
// own 'editor' and 'viewer'. Roles live in the auth user's metadata, not a
// separate profiles table, so TAF adds no cross-app database objects.

// Every role TAF understands / can assign when creating a user.
export const ALL_ROLES = ['admin', 'ceo', 'hr', 'editor', 'viewer']

// Roles allowed to create/update TAF data (partners, milestones, KPIs).
export const EDIT_ROLES = ['admin', 'ceo', 'hr', 'editor']

// Roles allowed to manage TAF users (the admin Users page + /api/users).
export const ADMIN_ROLES = ['admin']

export function canEditRole(role) {
  return EDIT_ROLES.includes(role)
}

export function canManageUsersRole(role) {
  return ADMIN_ROLES.includes(role)
}

// Resolve a user's role from a Supabase auth user object. app_metadata wins
// (only settable by admins/service-role) and falls back to user_metadata
// (where the existing project's roles are stored). Defaults to 'viewer'.
export function roleFromUser(user) {
  if (!user) return null
  return user.app_metadata?.role || user.user_metadata?.role || 'viewer'
}
