import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch, SearchUser, SearchCompany } from '@/contexts/searchContext';
import { api } from '@/lib/api'; 
import { formatMediaUrl } from '@/lib/media'; 
import { PageContainer, PageHeader } from '@/components/PageContainer';
import { GlassCard } from '@/components/GlassCard';
import { UserAvatar } from '@/components/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  Search as SearchIcon, 
  MapPin, 
  Building2, 
  Users, 
  Mail, 
  UserPlus, 
  UserCheck,
  Clock,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react';

export default function SearchPage() {
  const navigate = useNavigate();
  const { 
    query, 
    setQuery, 
    filteredUsers, 
    filteredCompanies, 
    isLoading,
    refreshData 
  } = useSearch();

 

  const handleUserClick = (id: string) => navigate(`/profile/${id}`);
  const handleCompanyClick = (id: string) => navigate(`/companies/${id}`);


  if (isLoading && !filteredUsers.length && !filteredCompanies.length) {
     return (
        <div className="flex h-screen items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
     
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="w-fit rounded-full pl-2 pr-4 gap-1 border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary transition-all group"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm font-medium">Back</span>
          </Button>
          
          <div className="flex-1">
             <PageHeader 
               title="Search" 
               description="Find people and companies"
             />
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto mt-2">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              className="pl-12 h-14 text-lg bg-secondary/30 backdrop-blur-md border-white/10 focus:border-primary/50 shadow-inner rounded-xl transition-all" 
              placeholder="Type to search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <Tabs defaultValue="people" className="space-y-6">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 p-1 bg-secondary/30 backdrop-blur-sm border border-white/10 rounded-xl">
              <TabsTrigger value="people" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4" />
                People ({filteredUsers.length})
              </TabsTrigger>
              <TabsTrigger value="companies" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Building2 className="h-4 w-4" />
                Companies ({filteredCompanies.length})
              </TabsTrigger>
            </TabsList>

         
            <TabsContent value="people" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
              {filteredUsers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredUsers.map((user) => (
                    <UserResultCard 
                      key={user._id} 
                      user={user} 
                      onClick={() => handleUserClick(user._id)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-white/10 rounded-2xl bg-white/5">
                   <Users className="h-10 w-10 mb-2 opacity-50" />
                   <p>No people found matching "{query}"</p>
                </div>
              )}
            </TabsContent>

          
            <TabsContent value="companies" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
              {filteredCompanies.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredCompanies.map((company) => (
                    <CompanyResultCard 
                      key={company._id} 
                      company={company} 
                      onClick={() => handleCompanyClick(company._id)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-white/10 rounded-2xl bg-white/5">
                   <Building2 className="h-10 w-10 mb-2 opacity-50" />
                   <p>No companies found matching "{query}"</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </div>
  );
}


function UserResultCard({ user, onClick }: { user: SearchUser, onClick: () => void }) {
  const { toast } = useToast();
  const { refreshData } = useSearch();
  
  const [connectionStatus, setConnectionStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('NONE');
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [showDisconnectAlert, setShowDisconnectAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await api.checkConnectionStatus(user._id);
        if (isMounted) {
          setConnectionStatus(res.status);
        }
      } catch (error) {
        console.error("Failed to check status", error);
        setConnectionStatus('NONE');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    checkStatus();
    return () => { isMounted = false; };
  }, [user._id]);


  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActionLoading(true);
    try {
      await api.sendConnectionRequest(user._id);
      setConnectionStatus('PENDING');
      toast({ title: "Request Sent", description: `Request sent to ${user.firstName}.` });
    } catch (error) {
      toast({ title: "Error", description: "Could not send request.", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveConnection = async (type: 'cancel' | 'disconnect') => {
    setIsActionLoading(true);
    try {
      await api.disconnect(user._id);
      
      setConnectionStatus('NONE');
      
      const title = type === 'cancel' ? "Request Withdrawn" : "Disconnected";
      const desc = type === 'cancel' 
        ? "Connection request cancelled." 
        : `You have disconnected from ${user.firstName}.`;

      toast({ title: title, description: desc });

    } catch (error) {
      toast({ title: "Error", description: "Operation failed.", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
      setShowCancelAlert(false);
      setShowDisconnectAlert(false);
    }
  };

  const renderActionButton = () => {
    if (isLoading) {
      return <Button disabled size="sm" variant="ghost" className="h-8 w-8 p-0"><Loader2 className="h-4 w-4 animate-spin" /></Button>;
    }

    if (connectionStatus === 'ACCEPTED') {
      return (
        <Button 
          size="sm" 
          variant="secondary" 
          className="gap-2 text-green-500 bg-green-500/10 hover:text-red-500 hover:bg-red-500/10 border border-green-500/20 hover:border-red-500/20 transition-all"
          onClick={(e) => { e.stopPropagation(); setShowDisconnectAlert(true); }}
          disabled={isActionLoading}
        >
          {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Connected
        </Button>
      );
    }

    if (connectionStatus === 'PENDING') {
      return (
        <Button 
          size="sm" 
          variant="outline"
          className="gap-2 text-muted-foreground hover:text-red-500 hover:border-red-500 hover:bg-red-500/5 transition-all"
          onClick={(e) => { e.stopPropagation(); setShowCancelAlert(true); }}
          disabled={isActionLoading}
        >
          {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
          Pending
        </Button>
      );
    }

    return (
      <Button 
        size="sm" 
        variant="default"
        className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
        onClick={handleConnect}
        disabled={isActionLoading}
      >
        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Connect
      </Button>
    );
  };

  return (
    <>
      <GlassCard 
        className="p-4 hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between"
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          <UserAvatar 
            name={`${user.firstName} ${user.lastName}`} 
            src={formatMediaUrl(user.image)} 
            size="lg" 
            className="border-2 border-white/10 group-hover:border-primary/50 transition-colors"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
              {user.firstName} {user.lastName}
            </h3>
            {user.headline && (
              <p className="text-sm text-muted-foreground truncate">
                {user.headline}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              {user.location && (
                  <>
                      <MapPin className="h-3 w-3" />
                      {user.location}
                  </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          {renderActionButton()}
        </div>
      </GlassCard>

      <AlertDialog open={showCancelAlert} onOpenChange={setShowCancelAlert}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your connection request to <b>{user.firstName}</b>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Keep</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.stopPropagation(); handleRemoveConnection('cancel'); }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isActionLoading}
            >
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDisconnectAlert} onOpenChange={setShowDisconnectAlert}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Connection?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <b>{user.firstName}</b> from your connections? 
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.stopPropagation(); handleRemoveConnection('disconnect'); }} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isActionLoading}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CompanyResultCard({ company, onClick }: { company: SearchCompany, onClick: () => void }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (isFollowing) {
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        await api.followCompany(company._id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Failed to follow/unfollow company", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard 
      className="p-4 hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl bg-secondary/50 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 group-hover:border-primary/30 transition-colors">
           {company.logo ? (
             <img 
               src={formatMediaUrl(company.logo)} 
               alt={company.name}
               className="h-full w-full object-cover"
               onError={(e) => {
                 e.currentTarget.src = 'https://via.placeholder.com/56/1a1a1a/ffffff?text=Logo';
               }}
             />
           ) : (
             <Building2 className="h-7 w-7 text-muted-foreground" />
           )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
            {company.name}
          </h3>
          
          <div className="flex flex-col gap-1 mt-1">
             <div className="flex items-center gap-1 text-xs text-muted-foreground">
               {company.location && (
                   <>
                       <MapPin className="h-3 w-3" />
                       {company.location}
                   </>
               )}
             </div>
             {company.email && (
               <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{company.email}</span>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
         <Button 
           size="sm" 
           variant={isFollowing ? "secondary" : "default"}
           className={`gap-2 min-w-[100px] transition-all ${!isFollowing ? 'shadow-lg shadow-primary/20' : ''}`}
           onClick={handleFollow}
           disabled={isLoading}
         >
           {isLoading ? (
             <Loader2 className="h-4 w-4 animate-spin" />
           ) : isFollowing ? (
             "Following"
           ) : (
             "Follow"
           )}
         </Button>
      </div>
    </GlassCard>
  );
}