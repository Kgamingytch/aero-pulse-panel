import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

const LogoImage = "/FlyPrague_logo_png.png";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    };
    checkUser();
  }, [navigate]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/Background.png')" }}
    >
      <div className="backdrop-blur-sm bg-white/50 min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Logo */}
            <img
              src={LogoImage}
              alt="FlyPrague Logo"
              className="h-32 w-auto mx-auto"
            />

            {/* Hero Section */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-foreground">
                Welcome to FlyPrague
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Your comprehensive airline management system for announcements, flights, and team coordination.
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 py-8">
              <div className="bg-card rounded-lg shadow-sm border p-6">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Flight Management</h3>
                <p className="text-sm text-muted-foreground">
                  Track and manage all your flights in real-time
                </p>
              </div>

              <div className="bg-card rounded-lg shadow-sm border p-6">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-6 w-6 text-primary rotate-45" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Announcements</h3>
                <p className="text-sm text-muted-foreground">
                  Keep your team informed with priority alerts
                </p>
              </div>

              <div className="bg-card rounded-lg shadow-sm border p-6">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-6 w-6 text-primary -rotate-45" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Team Access</h3>
                <p className="text-sm text-muted-foreground">
                  Role-based permissions for secure collaboration
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Button onClick={() => navigate("/auth")} size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
