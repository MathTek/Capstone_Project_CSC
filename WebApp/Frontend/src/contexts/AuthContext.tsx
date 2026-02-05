import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, registerUser, LoginResponse, RegisterRequest, APIError } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: number | null;
  displayConsent: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [displayConsent, setDisplayConsent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('csc_token');
    const storedUserId = localStorage.getItem('csc_user_id');
    const storedConsent = localStorage.getItem('csc_display_consent');

    if (token && storedUserId) {
      setIsAuthenticated(true);
      setUserId(parseInt(storedUserId, 10));
      setDisplayConsent(storedConsent === 'true');
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response: LoginResponse = await loginUser({ username, password });

      localStorage.setItem('csc_token', response.access_token);
      localStorage.setItem('csc_user_id', response.user_id.toString());

      if (response.display_consent !== undefined) {
        localStorage.setItem('csc_display_consent', response.display_consent.toString());
        setDisplayConsent(response.display_consent);
      }

      setUserId(response.user_id);
      setIsAuthenticated(true);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(0, 'An unexpected error occurred');
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await registerUser(data);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(0, 'An unexpected error occurred');
    }
  };

  const logout = () => {
    localStorage.removeItem('csc_token');
    localStorage.removeItem('csc_user_id');
    localStorage.removeItem('csc_display_consent');
    setIsAuthenticated(false);
    setUserId(null);
    setDisplayConsent(false);
  };

  const getToken = () => {
    return localStorage.getItem('csc_token');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userId,
      displayConsent,
      login,
      register,
      logout,
      getToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
