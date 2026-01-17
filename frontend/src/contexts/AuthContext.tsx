import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, User, Company } from "@/lib/api";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accountType: "user" | "company" | null;
  user: User | null;
  company: Company | null;
}

interface LoginResponse {
  success: boolean;
  token: string;
  role: "User" | "Company";
  accountType: "user" | "company";
  user?: User;
  company?: Company;
}

interface AuthContextType extends AuthState {
  loginUser: (email: string, password: string) => Promise<void>; 
  loginCompany: (email: string, password: string) => Promise<{ success: boolean; token: string; company: Company }>;
  signupUser: (data: FormData) => Promise<void>;
  signupCompany: (data: FormData) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    accountType: null,
    user: null,
    company: null,
  });

  const refreshSession = async () => {
    try {
      const token = api.getToken();
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const session = await api.getSession();

      setState({
        isAuthenticated: true,
        isLoading: false,
        accountType: session.accountType || null,
        user: session.user || null,
        company: session.company || null,
      });

    } catch (error: any) {
      console.error("Session refresh failed:", error);

      if (error.status === 401 || error.status === 403) {
        api.setToken(null);
        setState({
          isAuthenticated: false,
          isLoading: false,
          accountType: null,
          user: null,
          company: null,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const loginUser = async (email: string, password: string): Promise<void> => {
    const response = await api.loginUser(email, password);
    api.setToken(response.token);
    setState({
      isAuthenticated: true,
      isLoading: false,
      accountType: "user",
      user: response.user,
      company: null,
    });
  };

  const loginCompany = async (email: string, password: string): Promise<{ success: boolean; token: string; company: Company }> => {
    const response = await api.loginCompany(email, password);
    api.setToken(response.token);
    setState({
      isAuthenticated: true,
      isLoading: false,
      accountType: "company",
      user: null,
      company: response.company,
    });
    return response;
  };

  const signupUser = async (data: FormData): Promise<void> => {
    const response = await api.signupUser(data);
    api.setToken(response.token);
    setState({
      isAuthenticated: true,
      isLoading: false,
      accountType: "user",
      user: response.user,
      company: null,
    });
  };

  const signupCompany = async (data: FormData): Promise<void> => {
    const response = await api.signupCompany(data);
    api.setToken(response.token);
    setState({
      isAuthenticated: true,
      isLoading: false,
      accountType: "company",
      user: null,
      company: response.company,
    });
  };

  const logout = (): void => {
    api.setToken(null);
    setState({
      isAuthenticated: false,
      isLoading: false,
      accountType: null,
      user: null,
      company: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginUser,
        loginCompany,
        signupUser,
        signupCompany,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}