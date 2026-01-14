import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AuthState, LoginCredentials } from '../types/auth';
import * as authService from '../services/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token refresh interval (14 minutes - refresh before 15 min expiry)
const REFRESH_INTERVAL = 14 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Try to refresh token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await authService.refreshAccessToken();
        if (result) {
          setState({
            user: result.user,
            accessToken: result.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const interval = setInterval(async () => {
      const result = await authService.refreshAccessToken();
      if (result) {
        setState(prev => ({
          ...prev,
          user: result.user,
          accessToken: result.accessToken,
        }));
      } else {
        // Token refresh failed, log out
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials);
    setState({
      user: result.user,
      accessToken: result.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const result = await authService.refreshAccessToken();
      if (result) {
        setState(prev => ({
          ...prev,
          user: result.user,
          accessToken: result.accessToken,
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
