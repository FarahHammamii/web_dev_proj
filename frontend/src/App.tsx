import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { SearchProvider } from "@/contexts/searchContext"; 

import Index from "./pages/Index";
import Auth from "./pages/Auth";

import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Jobs from "./pages/Jobs";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Network from "./pages/Network";
import Settings from "./pages/Settings";
import CompanyDashboard from "./pages/CompanyDashboard";
import UserPosts from "./pages/UserPosts";
import CompanyJobs from "./pages/CompanyJobs";
import CompanyApplicants from "./pages/CompanyApplicants";
import CompanySettings from "./pages/CompanySettings";
import NotFound from "./pages/NotFound";
import PublicProfilePage from "./pages/publicProfile";
import Search from "./pages/search"; 
import CompanyPublicProfile from "./pages/CompanyPublicProfile";
import CompanyOwnerProfile from "./pages/CompanyOwnerProfile";
import CompanyNotificationsPage from "./pages/companyNotification"
import CompanyPosts from "./pages/companyPosts"
import CompanyAnalytics from "./pages/CompanyAnalytics"
import PublicCandidatePage from "./pages/companyCandidates"
import CompanyLayout from "./components/companyLayout";
import UserPublicProfileFromCompany from "./pages/UserPublicProfileFromCompany";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProfileProvider>
        <SearchProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* rasmi */}
                <Route path="/" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/notifications" element={<Notifications />} />
                
                <Route path="/network" element={<Network />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/search" element={<Search />} />

                {/*route profile */}
                <Route path="/profile" element={<Profile />} /> {/* mine*/}
                <Route path="/profile/:userId" element={<PublicProfilePage />} /> {/* others */}

                {/* msg */}
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:userId" element={<Messages />} />

                {/* posts */}
                <Route path="/my-posts" element={<UserPosts />} />
                <Route path="/users/:userId/posts" element={<UserPosts />} />
                <Route path="/profile/:userId/posts" element={<UserPosts />} />
                {/* company post */}
                <Route path="/companies/:id" element={<CompanyPublicProfile />} />
                <Route element={<CompanyLayout />}>
<Route path="/company/candidates/:userId" element={<UserPublicProfileFromCompany />} />
                    <Route path="/company/analytics" element={<CompanyAnalytics />} />
                    <Route path="/company/posts" element={<CompanyPosts />} />
                    <Route path="/company" element={<CompanyDashboard />} />
                    <Route path="/company/candidates/:userId" element={<PublicCandidatePage />} />
                    <Route path="/company/posts" element={<CompanyPosts />} />
                    <Route path="/company/applicants/:jobId" element={<CompanyApplicants />} />
                    <Route path="/company/profile" element={<CompanyOwnerProfile />} />
                    <Route path="/company/settings" element={<CompanySettings />} />
                    

                    {/* fazet saif ta navbar */}
                </Route>
                {/* company*/}
                <Route path="/company/notification" element={<CompanyNotificationsPage />} />

                {/* not found*/}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SearchProvider>
      </ProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;