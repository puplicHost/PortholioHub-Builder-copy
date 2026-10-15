// Route manifest (plan Phase 1 §33, Phase 9 §2): every route with its
// protection level. The manifest test fails on undeclared routes.

export type RouteLevel = 'public' | 'user' | 'admin';

export interface RouteEntry {
  path: string;
  level: RouteLevel;
}

export const ROUTES_MANIFEST: RouteEntry[] = [
  // Public pages
  { path: '/', level: 'public' },
  { path: '/en', level: 'public' },
  { path: '/login', level: 'public' },
  { path: '/register', level: 'public' },
  { path: '/change-password', level: 'user' },
  { path: '/terms', level: 'public' },
  { path: '/privacy', level: 'public' },
  { path: '/u/[username]', level: 'public' },
  { path: '/u/[username]/projects/[slug]', level: 'public' },
  // Builder (signed-in users)
  { path: '/profile/builder', level: 'user' },
  { path: '/profile/builder/analytics', level: 'user' },
  { path: '/profile/builder/verify-required', level: 'user' },
  { path: '/profile/subscription', level: 'user' },
  { path: '/profile/notifications', level: 'user' },
  // Admin pages
  { path: '/admin', level: 'admin' },
  { path: '/admin/users', level: 'admin' },
  { path: '/admin/users/[id]', level: 'admin' },
  { path: '/admin/requests', level: 'admin' },
  { path: '/admin/subscriptions', level: 'admin' },
  { path: '/admin/payments', level: 'admin' },
  { path: '/admin/plans', level: 'admin' },
  { path: '/admin/portfolios', level: 'admin' },
  { path: '/admin/audit-log', level: 'admin' },
  { path: '/admin/settings', level: 'admin' },
  // Public API
  { path: '/api/health', level: 'public' },
  { path: '/sitemap.xml', level: 'public' },
  { path: '/robots.txt', level: 'public' },
  { path: '/api/public/plans', level: 'public' },
  { path: '/api/username-available', level: 'public' },
  { path: '/api/verify-email', level: 'public' },
  { path: '/api/portfolio/track', level: 'public' },
  // User API
  { path: '/api/auth/register', level: 'public' },
  { path: '/api/auth/login', level: 'public' },
  { path: '/api/auth/logout', level: 'user' },
  { path: '/api/auth/me', level: 'user' },
  { path: '/api/auth/change-password', level: 'user' },
  { path: '/api/me/plans', level: 'user' },
  { path: '/api/me/subscription', level: 'user' },
  { path: '/api/me/subscription/history', level: 'user' },
  { path: '/api/me/subscription-requests', level: 'user' },
  { path: '/api/me/notifications', level: 'user' },
  { path: '/api/me/notifications/unread-count', level: 'user' },
  { path: '/api/me/notifications/[id]/read', level: 'user' },
  { path: '/api/me/notifications/read-all', level: 'user' },
  // Admin API
  { path: '/api/admin/dashboard', level: 'admin' },
  { path: '/api/admin/users', level: 'admin' },
  { path: '/api/admin/users/[id]', level: 'admin' },
  { path: '/api/admin/users/[id]/suspend', level: 'admin' },
  { path: '/api/admin/users/[id]/unsuspend', level: 'admin' },
  { path: '/api/admin/users/[id]/reset-password', level: 'admin' },
  { path: '/api/admin/users/[id]/revoke-sessions', level: 'admin' },
  { path: '/api/admin/subscription-requests', level: 'admin' },
  { path: '/api/admin/subscription-requests/[id]/approve', level: 'admin' },
  { path: '/api/admin/subscription-requests/[id]/reject', level: 'admin' },
  { path: '/api/admin/subscriptions', level: 'admin' },
  { path: '/api/admin/subscriptions/[id]/extend', level: 'admin' },
  { path: '/api/admin/subscriptions/[id]/suspend', level: 'admin' },
  { path: '/api/admin/subscriptions/[id]/unsuspend', level: 'admin' },
  { path: '/api/admin/payments', level: 'admin' },
  { path: '/api/admin/plans', level: 'admin' },
  { path: '/api/admin/plans/[id]', level: 'admin' },
  { path: '/api/admin/portfolios', level: 'admin' },
  { path: '/api/admin/portfolios/[username]/hide', level: 'admin' },
  { path: '/api/admin/portfolios/[username]/unhide', level: 'admin' },
  { path: '/api/admin/audit-log', level: 'admin' },
  { path: '/api/admin/settings', level: 'admin' },
  // Cron (Bearer CRON_SECRET, not sessions)
  { path: '/api/cron/cleanup', level: 'public' },
  { path: '/api/cron/subscription-lifecycle', level: 'public' },
];
