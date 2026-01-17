import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { CompanyNav } from "@/components/CompanyNav";
import { useAuth } from "@/contexts/AuthContext"; 
import { api } from "@/lib/api"; 

export default function CompanyLayout() {
  const { company: currentCompany, isAuthenticated, accountType, isLoading } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoading) {
       if (!isAuthenticated) navigate("/auth");
       else if (accountType !== "company") navigate("/feed");
    }
  }, [isLoading, isAuthenticated, accountType, navigate]);

  useEffect(() => {
    if (isAuthenticated && accountType === "company") {
        const fetchCount = async () => {
            try {
                const res = await api.getNotifications(); 
                if (res.success) {
                    const unread = res.data.filter((n: any) => !n.isRead).length;
                    setUnreadCount(unread);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchCount();
    }
  }, [isAuthenticated, accountType]);

  const navCompany = currentCompany ? {
    name: currentCompany.name,
    email: currentCompany.email,
    logo: currentCompany.logo
  } : undefined;

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <CompanyNav company={navCompany} unreadNotifications={unreadCount} />
      
      <Outlet /> 
    </div>
  );
}