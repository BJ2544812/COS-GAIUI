import * as React from 'react';
import { getToken as getBaseToken, setToken, clearToken } from '@/lib/authSession';
import { getSessionUserFromApi } from '@/lib/sessionApi';
import { ApiError } from '@/lib/apiClient';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Set when /auth/me fails with a transport error (API down); cleared on success. */
  connectivityError: string | null;
  clearConnectivityError: () => void;
  logout: () => void;
  /** Resolves session from /auth/me. Returns true when a usable user was loaded. */
  refreshUser: () => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

function getTokenSafely(): string | null {
  try {
    return getBaseToken();
  } catch (e) {
    console.error('[AuthContext] CRITICAL: Failed to access local storage', e);
    return null;
  }
}

/** Coerce /auth/me payload into a safe User; returns null if the session cannot be used. */
export function normalizeSessionUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  const username = o.username;
  if (typeof id !== 'string' || !id.trim() || typeof username !== 'string' || !username.trim()) {
    return null;
  }
  const permissions = Array.isArray(o.permissions)
    ? (o.permissions as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)
    : [];
  return {
    id: id.trim(),
    username: username.trim(),
    email: typeof o.email === 'string' ? o.email : '',
    role: typeof o.role === 'string' && o.role.trim() ? o.role.trim() : 'User',
    permissions,
  };
}

function shouldClearSessionOnMeFailure(status: number | undefined): boolean {
  if (status === undefined) return false;
  if (status === 0 || status === 408) return false;
  if (status === 400 || status === 401 || status === 403 || status === 404) return true;
  if (status >= 500) return true;
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [connectivityError, setConnectivityError] = React.useState<string | null>(null);
  // If we have a token, we ARE loading until we verify it.
  const [loading, setLoading] = React.useState<boolean>(!!getTokenSafely());

  const clearConnectivityError = React.useCallback(() => setConnectivityError(null), []);

  const refreshUser = React.useCallback(async (): Promise<boolean> => {
    const token = getTokenSafely();
    if (import.meta.env.DEV) {
      console.log('[AuthContext] refreshUser: INITIAL_STATE', { tokenExists: !!token, loading });
    }

    if (!token) {
      if (import.meta.env.DEV) console.log('[AuthContext] No token found. Stopping check.');
      setUser(null);
      setLoading(false);
      setConnectivityError(null);
      return false;
    }

    setLoading(true);
    try {
      if (import.meta.env.DEV) console.log('[AuthContext] Verifying token via /auth/me...');
      const raw = await getSessionUserFromApi();
      const u = normalizeSessionUser(raw);
      if (!u) {
        console.warn('[AuthContext] /auth/me returned an unusable user payload; clearing session.');
        clearToken();
        setUser(null);
        setConnectivityError(null);
        return false;
      }
      if (import.meta.env.DEV) console.log('[AuthContext] VERIFIED: User loaded:', u.username);
      setUser(u);
      setConnectivityError(null);
      return true;
    } catch (e: unknown) {
      console.error('[AuthContext] VERIFICATION_FAILED:', e);
      const status = e instanceof ApiError ? e.status : undefined;
      if (status === 0) {
        setConnectivityError(
          e instanceof ApiError
            ? e.message
            : 'Cannot reach the Kingdom OS API. Start the backend (npm run dev:server) and ensure port 4002 is free.',
        );
      } else {
        setConnectivityError(null);
      }
      if (shouldClearSessionOnMeFailure(status)) {
        console.warn('[AuthContext] Session invalid or server error on /auth/me; clearing stored credentials.', {
          status,
        });
        clearToken();
      }
      setUser(null);
      return false;
    } finally {
      if (import.meta.env.DEV) console.log('[AuthContext] refreshUser: FINISHED');
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (import.meta.env.DEV) console.log('[AuthProvider] Mount. Initializing session check...');
    void refreshUser().catch(() => {
      /* rejection already logged inside refreshUser; absorb for StrictMode / floating promise */
    });
  }, [refreshUser]);

  const logout = () => {
    if (import.meta.env.DEV) console.log('[AuthContext] Logout initiated.');
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, connectivityError, clearConnectivityError, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePermissions() {
  const { user } = useAuth();

  const isSuperAdmin = (): boolean => {
    if (!user) return false;
    const normalizedRole = user.role?.toUpperCase()?.replace(/\s/g, '_');
    return normalizedRole === 'SUPER_ADMIN';
  };

  const has = (permission: string) => {
    if (!user) return false;
    if (isSuperAdmin()) return true;
    const list = Array.isArray(user.permissions) ? user.permissions : [];
    return list.includes(permission);
  };

  const hasAny = (permissions: string[]) => {
    return permissions.some(p => has(p));
  };

  return { has, hasAny, isSuperAdmin, user };
}

