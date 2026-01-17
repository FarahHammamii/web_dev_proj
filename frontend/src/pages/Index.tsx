import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { MainNav } from "@/components/MainNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  Users,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Build Your Network",
    description: "Connect with professionals worldwide and grow your career opportunities.",
  },
  {
    icon: Briefcase,
    title: "Find Dream Jobs",
    description: "Discover personalized job recommendations powered by AI matching.",
  },
  {
    icon: MessageSquare,
    title: "Engage & Share",
    description: "Share insights, learn from others, and build your professional brand.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description: "Let AI help you write better content and find perfect opportunities.",
  },
];

const stats = [
  { value: "50K+", label: "Professionals" },
  { value: "10K+", label: "Companies" },
  { value: "25K+", label: "Jobs Posted" },
  { value: "98%", label: "Satisfaction" },
];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to feed if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/feed");
    }
  }, [isLoading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Use MainNav component */}
      <MainNav />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-warm" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
            <Sparkles className="h-4 w-4" />
            AI-Powered Professional Network
          </div>
          
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in delay-100">
            Your Career,{" "}
            <span className="text-gradient-hero">Reimagined</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in delay-200">
            Connect with opportunities, build meaningful relationships, and accelerate your career with intelligent insights and AI-powered tools.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in delay-300">
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Start for free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/jobs">Browse jobs</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 animate-fade-in delay-400">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you connect, grow, and achieve your professional goals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <GlassCard key={feature.title} className="p-6 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-8 md:p-12 text-center bg-gradient-card">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your career?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of professionals already using Nexus to advance their careers.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth?mode=signup">
                Get started today
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Nexus</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Nexus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
