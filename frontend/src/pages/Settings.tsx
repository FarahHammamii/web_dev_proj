import { useState, useEffect, useRef } from "react";
import { MainNav } from "@/components/MainNav";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  Shield,
  Smartphone,
  Camera,
  Save,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatMediaUrl } from "@/lib/media"; 
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

 
  const [userId, setUserId] = useState<string>(""); 
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [about, setAbout] = useState("");

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [connectionNotifications, setConnectionNotifications] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [allowMessaging, setAllowMessaging] = useState("connections");
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const fetchUserData = async () => {
  try {
    const user = await api.getUserProfile();
    
    if (user) {
      const id = user._id ? user._id.toString() : '';
      if (!id) {
        toast.error("User ID not found");
        return;
      }
      
      setUserId(id);
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setHeadline(user.headline || "");
      setLocation(user.location || "");
      setAbout(user.about || "");
      setCurrentAvatarUrl(user.image);
    }
  } catch (error) {
    console.error("Failed to load user settings", error);
    toast.error("Failed to load profile data");
  }
};

    fetchUserData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
  if (!userId) {
    toast.error("User ID not found");
    return;
  }

  setIsLoading(true);
  try {
    const formData = new FormData();
    
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("headline", headline);
    formData.append("location", location);
    formData.append("about", about);

    if (avatarFile) {
      formData.append("image", avatarFile);
    }

    const response = await api.updateUserProfile(userId, formData);

    if (response && response.data) {
      const updatedUser = response.data;
      setFirstName(updatedUser.firstName);
      setLastName(updatedUser.lastName);
      setEmail(updatedUser.email || email);
      setHeadline(updatedUser.headline || headline);
      setLocation(updatedUser.location || location);
      setAbout(updatedUser.about || about);
      
      if (updatedUser.image) {
        setCurrentAvatarUrl(updatedUser.image);
        setAvatarPreview(undefined);
        setAvatarFile(null);
      }
    }

    toast.success("Settings saved successfully");
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Failed to update profile");
  } finally {
    setIsLoading(false);
  }
};
  const navbarUser = isAuthenticated ? {
    name: `${firstName} ${lastName}`,
    email: email,
    avatar: formatMediaUrl(avatarPreview || currentAvatarUrl),
    role: "user" as const
  } : undefined;

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={navbarUser} unreadNotifications={unreadCount} />

      <PageContainer>
        <PageHeader
          title="Settings"
          description="Manage your account preferences and privacy"
        />

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            
            
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

        
          <TabsContent value="profile" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-semibold mb-6">Profile Information</h3>
              
       
              <div className="flex items-center gap-6 mb-6">
                <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleFileChange}
                    />
                  
                  <UserAvatar 
                    name={`${firstName} ${lastName}`} 
                    src={avatarPreview || formatMediaUrl(currentAvatarUrl)} 
                    size="xl" 
                    className="border-4 border-background"
                  />
                  
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md group-hover:scale-110 transition-transform"
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerFileInput();
                    }}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h4 className="font-medium">Profile Photo</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={triggerFileInput}>
                        Upload
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(undefined);
                        }}
                    >
                        Remove
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g., Senior Product Designer at TechCorp"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="about">About</Label>
                  <Textarea
                    id="about"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button 
                    className="bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 transition-opacity" 
                    onClick={handleSave} 
                    disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">Saving...</span>
                  ) : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </>
                  )}
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

         
          <TabsContent value="notifications" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-semibold mb-6">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Messages</Label>
                    <p className="text-sm text-muted-foreground">When someone sends you a message</p>
                  </div>
                  <Switch checked={messageNotifications} onCheckedChange={setMessageNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Connection Requests</Label>
                    <p className="text-sm text-muted-foreground">When someone wants to connect</p>
                  </div>
                  <Switch checked={connectionNotifications} onCheckedChange={setConnectionNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Job Alerts</Label>
                    <p className="text-sm text-muted-foreground">Jobs matching your preferences</p>
                  </div>
                  <Switch checked={jobAlerts} onCheckedChange={setJobAlerts} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">Summary of activity on your profile</p>
                  </div>
                  <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-semibold mb-6">Push Notifications</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-semibold mb-6">Profile Visibility</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Who can see your profile</Label>
                  <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone on Nexus</SelectItem>
                      <SelectItem value="connections">Connections Only</SelectItem>
                      <SelectItem value="private">Private - Only you</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Email Address</Label>
                    <p className="text-sm text-muted-foreground">Display email on your profile</p>
                  </div>
                  <Switch checked={showEmail} onCheckedChange={setShowEmail} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Phone Number</Label>
                    <p className="text-sm text-muted-foreground">Display phone on your profile</p>
                  </div>
                  <Switch checked={showPhone} onCheckedChange={setShowPhone} />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-semibold mb-6">Messaging</h3>
              <div className="space-y-2">
                <Label>Who can send you messages</Label>
                <Select value={allowMessaging} onValueChange={setAllowMessaging}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="connections">Connections Only</SelectItem>
                    <SelectItem value="none">No One</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-semibold mb-6">Theme & Display</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Theme
                  </Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-semibold mb-6">Password</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button variant="outline">Update Password</Button>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-semibold mb-6">Data & Privacy</h3>
              <div className="space-y-4">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Your Data
                </Button>
                <Separator />
                <div>
                  <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
}