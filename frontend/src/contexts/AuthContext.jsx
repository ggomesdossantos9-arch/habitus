import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService.js';
import { refreshSession } from '../services/api.js';
import { subscribeSessionExpired } from '../services/sessionEvents.js';

export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const restore = useCallback(async () => {
    try {
      await refreshSession();
      setUser(await authService.me());
    }
    catch { setUser(null); }
    finally { setIsLoading(false); }
  }, []);
  useEffect(() => {
    const unsubscribe = subscribeSessionExpired(() => setUser(null));
    restore();
    return unsubscribe;
  }, [restore]);
  const login = useCallback(async (values) => { const current = await authService.login(values); setUser(current); return current; }, []);
  const register = useCallback(async (values) => { const current = await authService.register(values); setUser(current); return current; }, []);
  const logout = useCallback(async () => { try { await authService.logout(); } finally { setUser(null); } }, []);
  const value = useMemo(() => ({ user, isLoading, login, register, logout, refreshUser: async () => setUser(await authService.me()) }), [user, isLoading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
