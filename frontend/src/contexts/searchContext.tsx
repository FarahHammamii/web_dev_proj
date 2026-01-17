import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export interface SearchUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
  location?: string;
  headline?: string;
}

export interface SearchCompany {
  _id: string;
  name: string;
  email: string;
  logo?: string;
  location?: string;
}

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  filteredUsers: SearchUser[];
  filteredCompanies: SearchCompany[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState<SearchUser[]>([]);
  const [allCompanies, setAllCompanies] = useState<SearchCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  const refreshData = async () => {
    if (hasFetchedRef.current && allUsers.length > 0 && allCompanies.length > 0) {
      return;  
    }

    setIsLoading(true);
    try {
      const [usersData, companiesData] = await Promise.all([
        api.getAllUsers(),
        api.getAllCompanies()
      ]);
      
      if (!hasFetchedRef.current) {
        setAllUsers(Array.isArray(usersData) ? usersData : []);
        setAllCompanies(Array.isArray(companiesData) ? companiesData : []);
        hasFetchedRef.current = true;
      }
    } catch (error) {
      console.error("Failed to load search data", error);
      setAllUsers([]);
      setAllCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    
 
    return () => {
      hasFetchedRef.current = false;
    };
  }, []);

  const lowerQuery = query.toLowerCase();

  const filteredUsers = allUsers.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const location = (user.location || '').toLowerCase();
    const headline = (user.headline || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    
    return fullName.includes(lowerQuery) || 
           location.includes(lowerQuery) || 
           headline.includes(lowerQuery) ||
           email.includes(lowerQuery);
  });

  const filteredCompanies = allCompanies.filter(company => {
    const name = (company.name || '').toLowerCase();
    const location = (company.location || '').toLowerCase();
    const email = (company.email || '').toLowerCase();
    
    return name.includes(lowerQuery) || 
           location.includes(lowerQuery) ||
           email.includes(lowerQuery);
  });

  const uniqueUsers = Array.from(new Map(filteredUsers.map(user => [user._id, user])).values());
  const uniqueCompanies = Array.from(new Map(filteredCompanies.map(company => [company._id, company])).values());

  const contextValue: SearchContextType = {
    query,
    setQuery,
    filteredUsers: uniqueUsers,
    filteredCompanies: uniqueCompanies,
    isLoading,
    refreshData
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}