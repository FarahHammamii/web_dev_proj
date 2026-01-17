import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api, User, Connection } from "@/lib/api";
import { toast } from "sonner";

export interface UserBasic {
  _id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  image?: string;
  location?: string;
  bio?: string;
}

export interface PendingRequest {
  _id: string; 
  requester: UserBasic;
  recipient: UserBasic;
  createdAt: string;
}

interface NetworkContextType {
  connections: UserBasic[];
  pendingRequests: PendingRequest[];
  suggestions: UserBasic[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
  acceptRequest: (connectionId: string) => Promise<void>;
  rejectRequest: (connectionId: string) => Promise<void>;
  removeConnection: (userId: string) => Promise<void>;
  sendConnectionRequest: (userId: string) => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<UserBasic[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<UserBasic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const userProfile = await api.getUserProfile();
      setCurrentUser(userProfile);
      return userProfile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }, []);

  const toUserBasic = useCallback((user: User): UserBasic => ({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    headline: user.headline,
    bio: user.about || user.headline,
    image: user.image,
    location: user.location
  }), []);

  const fetchData = useCallback(async () => {
    console.log("fetchData called");
    
    const user = await fetchCurrentUser();
    if (!user?._id) {
      console.log("No user available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("📡 Making API calls for user:", user._id);
      
      const [connsData, pendingData, suggsData] = await Promise.allSettled([
        api.getMyConnections().catch(err => {
          console.error("Error fetching connections:", err);
          return [];
        }),
        api.getPendingRequests().catch(err => {
          console.error("Error fetching pending requests:", err);
          return { success: false, data: [] };
        }),
        api.getUserSuggestions(5).catch(err => {
          console.error("Error fetching suggestions:", err);
          return [];
        }),
      ]);

      console.log("API Responses received");

    
      if (connsData.status === 'fulfilled' && Array.isArray(connsData.value)) {
        console.log(`Setting ${connsData.value.length} connections`);
        setConnections(connsData.value.map(toUserBasic));
      } else {
        console.warn("Connections data not available");
        setConnections([]);
      }

      let pendingConnections: Connection[] = [];
      
      if (pendingData.status === 'fulfilled' && pendingData.value) {
        const pendingValue = pendingData.value;
        
        if (pendingValue && typeof pendingValue === 'object' && 'data' in pendingValue && Array.isArray(pendingValue.data)) {
          pendingConnections = pendingValue.data;
        } else if (Array.isArray(pendingValue)) {
          pendingConnections = pendingValue;
        }
      }
      
      console.log(`Processing ${pendingConnections.length} pending connections`);

      const transformedPendingRequests: PendingRequest[] = pendingConnections
        .filter(conn => conn.requester && conn.recipient) 
        .map(conn => {
          const isUserRequester = conn.requester._id === user._id;
          const otherUser = isUserRequester ? conn.recipient : conn.requester;
          
          return {
            _id: conn._id,
            requester: {
              _id: conn.requester._id,
              firstName: conn.requester.firstName,
              lastName: conn.requester.lastName,
              headline: conn.requester.headline,
              image: conn.requester.image,
              location: conn.requester.location
            },
            recipient: {
              _id: conn.recipient._id,
              firstName: conn.recipient.firstName,
              lastName: conn.recipient.lastName,
              headline: conn.recipient.headline,
              image: conn.recipient.image,
              location: conn.recipient.location
            },
            createdAt: conn.createdAt
          };
        });

      const filteredPendingRequests = transformedPendingRequests.filter(req => 
        req.requester._id !== user._id
      );

      setPendingRequests(filteredPendingRequests);

      if (suggsData.status === 'fulfilled' && Array.isArray(suggsData.value)) {
        console.log(`Setting ${suggsData.value.length} suggestions`);
        
        const connectionIds = new Set(connections.map(c => c._id));
        const pendingIds = new Set(filteredPendingRequests.map(p => p.requester._id));
        
        const filteredSuggestions = suggsData.value
          .filter(suggestion => 
            !connectionIds.has(suggestion._id) && 
            !pendingIds.has(suggestion._id) &&
            suggestion._id !== user._id
          )
          .map(toUserBasic);
          
        setSuggestions(filteredSuggestions);
      } else {
        console.warn("Suggestions data not available");
        setSuggestions([]);
      }

      setHasLoaded(true);
      console.log("Data fetch completed successfully");

    } catch (error) {
      console.error("Critical error in fetchData:", error);
      toast.error("Could not load network data");
    } finally {
      setIsLoading(false);
      console.log("fetchData completed");
    }
  }, [fetchCurrentUser, toUserBasic, connections]); 

  useEffect(() => {
    console.log("useEffect triggered, hasLoaded:", hasLoaded);
    
    if (!hasLoaded) {
      fetchData();
    }
  }, [hasLoaded, fetchData]);


  const acceptRequest = async (connectionId: string) => {
    try {
      await api.respondToConnectionRequest(connectionId, "ACCEPTED");
      toast.success("Connection accepted!");

      const request = pendingRequests.find(r => r._id === connectionId);
      if (request) {
        setPendingRequests(prev => prev.filter(r => r._id !== connectionId));
        setConnections(prev => [...prev, request.requester]);
        
        setSuggestions(prev => prev.filter(s => s._id !== request.requester._id));
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to accept request");
    }
  };

  const rejectRequest = async (connectionId: string) => {
    try {
      await api.respondToConnectionRequest(connectionId, "REJECTED");
      toast.success("Request ignored");
      
      const request = pendingRequests.find(r => r._id === connectionId);
      setPendingRequests(prev => prev.filter(r => r._id !== connectionId));
      
      if (request) {
        setSuggestions(prev => [...prev, request.requester]);
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to reject request");
    }
  };

  const removeConnection = async (userId: string) => {
    try {
      await api.disconnect(userId);
      toast.success("Connection removed");
      
      const removedConnection = connections.find(c => c._id === userId);
      setConnections(prev => prev.filter(u => u._id !== userId));
      
      if (removedConnection) {
        setSuggestions(prev => [...prev, removedConnection]);
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to remove connection");
    }
  };

  const sendConnectionRequest = async (userId: string) => {
    try {
      await api.sendConnectionRequest(userId);
      toast.success("Request sent!");
      
      setSuggestions(prev => prev.filter(u => u._id !== userId));

    } catch (error: any) {
      toast.error(error.message || "Failed to send request");
    }
  };

  console.log("NetworkContext render state:", {
    isLoading,
    hasLoaded,
    connectionsCount: connections.length,
    pendingCount: pendingRequests.length,
    suggestionsCount: suggestions.length
  });

  return (
    <NetworkContext.Provider
      value={{
        connections,
        pendingRequests,
        suggestions,
        isLoading,
        fetchData,
        acceptRequest,
        rejectRequest,
        removeConnection,
        sendConnectionRequest,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};