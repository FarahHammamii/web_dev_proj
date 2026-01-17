import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '@/lib/api'; 

interface ProfileContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refetchUser: () => Promise<void>;
  logout: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    const token = api.getToken();
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userData = await api.getUserProfile();
      setUser(userData);
      
    } catch (err: any) {
      console.error("Profile Fetch Error:", err);
      setError(err.message || "Failed to load profile");

      if (err.message.includes("401") || err.message.includes("Token expired")) {
        api.setToken(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const logout = () => {
    api.setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <ProfileContext.Provider value={{ user, isLoading, error, refetchUser: fetchUserProfile, logout }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};