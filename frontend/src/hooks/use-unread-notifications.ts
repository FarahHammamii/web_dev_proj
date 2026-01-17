import { useState, useEffect } from "react";
import { api, Notification } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadNotifications() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.getNotifications();
      if (response.success && Array.isArray(response.data)) {
        const unread = response.data.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch unread notifications count:", error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return { unreadCount, isLoading, refetch: fetchUnreadCount };
}
