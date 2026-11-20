import type { User } from '../types';

export function getPortalPath(role: User['role'] | undefined) {
  if (role === 'admin') return '/admin';
  if (role === 'business') return '/business';
  return '/my';
}
