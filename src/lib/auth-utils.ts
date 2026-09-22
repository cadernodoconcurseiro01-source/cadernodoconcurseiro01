export const OAUTH_RETURN_PATH_KEY = 'oauth_return_path';

export function sanitizeReturnPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path === '/auth' || path.startsWith('/auth/callback')) {
    return '/';
  }

  return path;
}