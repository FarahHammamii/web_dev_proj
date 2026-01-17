import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NetworkProvider, useNetwork } from "@/contexts/NetworkContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { MainNav } from "@/components/MainNav";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMediaUrl } from "@/lib/media";
import { api } from "@/lib/api";
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  Clock,
  MessageSquare,
  MoreHorizontal,
  Building2,
  MapPin,
  Check,
  X,
  Loader2,
  RefreshCw
} from "lucide-react";


const getUserBio = (user: any) => {
  return user.bio || user.headline || "";
};

function NetworkContent() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const { 
    connections, 
    pendingRequests, 
    suggestions, 
    isLoading,
    acceptRequest, 
    rejectRequest, 
    removeConnection, 
    sendConnectionRequest 
  } = useNetwork();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUser = async () => {
        try {
          const userData = await api.getUserProfile();
          setCurrentUser(userData);
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      };
      fetchUser();
    }
  }, [isAuthenticated]);

  const [searchQuery, setSearchQuery] = useState("");
  const [hasData, setHasData] = useState(false);

  const filteredConnections = connections.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProfileClick = (id: string) => {
    navigate(`/profile/${id}`);
  };

  useEffect(() => {
    if (connections.length > 0 || pendingRequests.length > 0 || suggestions.length > 0) {
      setHasData(true);
    }
  }, [connections, pendingRequests, suggestions]);

  const navbarUser = isAuthenticated ? (
    currentUser ? {
      name: `${currentUser.firstName} ${currentUser.lastName}`,
      email: currentUser.email,
      avatar: formatMediaUrl(currentUser.image),
      role: "user" as const
    } : {
      name: "Loading...",
      email: "",
      avatar: undefined,
      role: "user" as const
    }
  ) : undefined;

  if (isLoading && !hasData) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav user={navbarUser} unreadNotifications={unreadCount} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your network...</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={navbarUser} unreadNotifications={unreadCount} />

      <PageContainer>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <PageHeader
            title="My Network"
            description="Manage your professional connections"
          />
          
       
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <main>
            <Tabs defaultValue="connections" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TabsList>
                  <TabsTrigger value="connections" className="gap-2">
                    <UserCheck className="h-4 w-4" />
                    Connections ({connections.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Pending ({pendingRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Suggestions ({suggestions.length})
                  </TabsTrigger>
                </TabsList>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search connections..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <TabsContent value="connections" className="space-y-4">
                {filteredConnections.length > 0 ? (
                  filteredConnections.map((user) => (
                    <GlassCard key={user._id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div onClick={() => handleProfileClick(user._id)} className="cursor-pointer">
                           <UserAvatar
                             name={`${user.firstName} ${user.lastName}`}
                             src={formatMediaUrl(user.image)} 
                             size="lg"
                           />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 
                            onClick={() => handleProfileClick(user._id)}
                            className="font-semibold hover:text-primary cursor-pointer transition-colors"
                          >
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {getUserBio(user)}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                             {user.location && (
                               <span className="flex items-center gap-1">
                                 <MapPin className="h-3 w-3" /> {user.location}
                               </span>
                             )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/messages?user=${user._id}`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeConnection(user._id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No connections found</p>
                    {searchQuery && (
                      <p className="text-sm mt-2">Try clearing your search</p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                {pendingRequests.length > 0 ? (
                  <>
                    <h3 className="font-semibold text-lg">Invitations ({pendingRequests.length})</h3>
                    {pendingRequests.map((req) => (
                      <GlassCard key={req._id} className="p-4">
                        <div className="flex items-start gap-4">
                           <div onClick={() => handleProfileClick(req.requester._id)} className="cursor-pointer">
                              <UserAvatar
                                name={`${req.requester.firstName} ${req.requester.lastName}`}
                                src={formatMediaUrl(req.requester.image)}
                                size="lg"
                              />
                           </div>
                          <div className="flex-1 min-w-0">
                            <h3 
                              onClick={() => handleProfileClick(req.requester._id)}
                              className="font-semibold hover:text-primary cursor-pointer transition-colors"
                            >
                              {req.requester.firstName} {req.requester.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {getUserBio(req.requester)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                               Sent {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rejectRequest(req._id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Ignore
                            </Button>
                            <Button
                              variant="gradient"
                              size="sm"
                              onClick={() => acceptRequest(req._id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending invitations</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="suggestions" className="space-y-4">
                <h3 className="font-semibold text-lg">People you may know ({suggestions.length})</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {suggestions.length > 0 ? (
                    suggestions.map((person) => (
                      <GlassCard key={person._id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div onClick={() => handleProfileClick(person._id)} className="cursor-pointer">
                             <UserAvatar
                               name={`${person.firstName} ${person.lastName}`}
                               src={formatMediaUrl(person.image)}
                               size="lg"
                             />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 
                               onClick={() => handleProfileClick(person._id)}
                               className="font-semibold truncate hover:text-primary cursor-pointer transition-colors"
                            >
                              {person.firstName} {person.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {getUserBio(person)}
                            </p>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-3"
                                onClick={() => sendConnectionRequest(person._id)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Connect
                            </Button>
                          </div>
                        </div>
                      </GlassCard>
                    ))
                  ) : (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                         <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                         <p>No suggestions available right now.</p>
                      </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </main>

          <aside className="hidden lg:block space-y-4">
            <GlassCard className="p-4">
              <h3 className="font-display font-semibold mb-4">Your Network</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Connections</span>
                  <span className="font-semibold text-primary">{connections.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending requests</span>
                  <span className="font-semibold">{pendingRequests.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Suggestions</span>
                  <span className="font-semibold">{suggestions.length}</span>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <h3 className="font-display font-semibold mb-4">Manage Network</h3>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm"
                  onClick={() => navigate("/search")}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find People
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  Following
                </Button>
              </div>
            </GlassCard>
          </aside>
        </div>
      </PageContainer>
    </div>
  );
}

export default function NetworkPage() {
    return (
        <NetworkProvider>
            <NetworkContent />
        </NetworkProvider>
    )
}