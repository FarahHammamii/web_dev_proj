import { useState, useEffect, ChangeEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/GlassCard";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  MapPin,
  Upload,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { User as UserType, Company } from "@/lib/api";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginCompany, loginUser, signupUser, signupCompany } = useAuth();
  
  const defaultTab = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"user" | "company">("user");
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(null);
    setShowPassword(false);
  }, [activeTab]);
const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const formData = new FormData(e.currentTarget);
    if (!formData.get("location")) formData.set("location", "");

    if (accountType === "user") {
      await signupUser(formData);
      toast.success("Account created successfully!");
      navigate("/feed");
    } else {
      await signupCompany(formData);
      toast.success("Company account created successfully!");
      navigate("/company");
    }
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Signup failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    setPreviewUrl(null);
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);
  
  const formData = new FormData(e.currentTarget);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  try {
    if (accountType === "user") {
      await loginUser(email, password);
      toast.success("Welcome back!");
      navigate("/feed");
    } else {
      const response = await loginCompany(email, password);
      toast.success("Welcome back!");
      navigate("/company");
    }
  } catch (error: any) {
    toast.error(error.message || "Login failed");
  } finally {
    setIsLoading(false);
  }
};

  const AccountTypeSelector = () => (
    <div className="grid grid-cols-2 gap-4">
      <GlassCard
        hover={false}
        className={`p-4 cursor-pointer transition-all ${accountType === "user" ? "ring-2 ring-primary border-primary" : "opacity-70 hover:opacity-100"}`}
        onClick={() => setAccountType("user")}
      >
        <div className="flex flex-col items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Professional</span>
        </div>
      </GlassCard>
      <GlassCard
        hover={false}
        className={`p-4 cursor-pointer transition-all ${accountType === "company" ? "ring-2 ring-primary border-primary" : "opacity-70 hover:opacity-100"}`}
        onClick={() => setAccountType("company")}
      >
        <div className="flex flex-col items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Company</span>
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur">
              <Sparkles className="h-7 w-7" />
            </div>
            <span className="font-display text-3xl font-bold">Connectify</span>
          </Link>
          <div className="space-y-6 max-w-lg">
            <h1 className="font-display text-5xl font-bold leading-tight">
              Start smart. Connect early.
            </h1>
            <p className="text-xl text-primary-foreground/80">
              A complete academic project where web, intelligence, and data come together.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/80">
            Made by <span className="font-semibold">3</span> amazing engineers
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="font-display text-2xl font-bold">Welcome back</h2>
                <p className="text-muted-foreground">Select your account type to continue</p>
              </div>
              
              <AccountTypeSelector />

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="login-email" name="email" type="email" placeholder={accountType === 'company' ? "company@example.com" : "name@example.com"} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="login-password" name="password" type="password" placeholder="••••••••" className="pl-10" required />
                  </div>
                </div>
                <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="font-display text-2xl font-bold">Create an account</h2>
                <p className="text-muted-foreground">Start your professional journey today</p>
              </div>

              <AccountTypeSelector />

              <form onSubmit={handleSignup} className="space-y-4" encType="multipart/form-data">
                
                <div className="flex flex-col items-center justify-center gap-3 mb-6">
                    <div className="relative group">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className={`w-28 h-28 ${accountType === 'user' ? 'rounded-full' : 'rounded-2xl'} bg-muted/50 flex items-center justify-center overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors`}>
                          {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                              {accountType === 'user' ? <User className="h-8 w-8 mb-1"/> : <Building2 className="h-8 w-8 mb-1"/>}
                              <span className="text-xs">Upload</span>
                            </div>
                          )}
                          {previewUrl && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Upload className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                      </Label>
                      {previewUrl && (
                         <button onClick={clearFile} className="absolute -top-1 -right-1 bg-destructive text-white p-1 rounded-full shadow-sm hover:bg-destructive/90 transition-colors z-10">
                             <X className="h-3 w-3" />
                         </button>
                     )}
                    </div>
                    
                    <Input 
                      id="file-upload" 
                      name={accountType === 'user' ? 'image' : 'logo'}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      {accountType === 'user' ? 'Profile Picture' : 'Company Logo'} (optional)
                    </p>
                </div>

                {accountType === "user" ? (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input id="firstName" name="firstName" placeholder="John" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input id="lastName" name="lastName" placeholder="Doe" required />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="companyName">Company name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="companyName" name="name" placeholder="Acme Inc." className="pl-10" required />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="signup-email" name="email" type="email" placeholder="name@example.com" className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="signup-password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="location" name="location" placeholder="San Francisco, CA" className="pl-10" />
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" required />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                    I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                  </label>
                </div>

                <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}