import { useEffect, useRef, useState } from "react";
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
  Building2,
  Bell,
  Shield,
  Camera,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {api} from "@/lib/api";
import { formatMediaUrl } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";

export default function CompanySettings() {
  const { company:authCompany } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");


  const [currentLogo, setCurrentLogo] = useState<string | undefined>();
  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [newApplications, setNewApplications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  useEffect(() => {
    if (!authCompany) return;

    setName(authCompany.name || "");
    setEmail(authCompany.email || "");
    setLocation(authCompany.location || "");
    setWebsite(authCompany.website || "");
    setDescription(authCompany.description || "");
    setCurrentLogo(authCompany.logo);
  }, [authCompany]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    if (!authCompany?._id) {
      toast.error("Company not found");
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("location", location);
      formData.append("website", website);
      formData.append("description", description);
      if (logoFile) formData.append("logo", logoFile);

      await api.updateCompanyProfile(authCompany._id, formData);

      toast.success("Company settings updated");
      setLogoPreview(undefined);
      setLogoFile(null);
    } catch (err) {
      toast.error("Failed to update company");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <PageContainer>
        <PageHeader
          title="Company Settings"
          description="Manage your company profile and preferences"
        />

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:w-auto">
            <TabsTrigger value="profile" className="gap-2">
              <Building2 className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" /> Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-6">
                Company Information
              </h3>

              <div className="flex items-center gap-6 mb-6">
                <div
                  className="relative cursor-pointer group"
                  onClick={triggerFileInput}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />

                  <UserAvatar
                    name={name}
                    src={formatMediaUrl(logoPreview || currentLogo)}
                    size="xl"
                  />

                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium">Company Logo</h4>
                  <p className="text-sm text-muted-foreground">
                    JPG or PNG. Recommended 400×400
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label>Company Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div>
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>

                <div>
                  <Label>Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>

                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="notifications">
            <GlassCard className="p-6 space-y-4">
              <div className="flex justify-between">
                <div>
                  <Label>New Applications</Label>
                  <p className="text-sm text-muted-foreground">
                    When someone applies
                  </p>
                </div>
                <Switch checked={newApplications} onCheckedChange={setNewApplications} />
              </div>

              <Separator />

              <div className="flex justify-between">
                <div>
                  <Label>Weekly Report</Label>
                  <p className="text-sm text-muted-foreground">
                    Company activity summary
                  </p>
                </div>
                <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="security">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-destructive">
                Danger Zone
              </h3>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Company
              </Button>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </div>
  );
}
