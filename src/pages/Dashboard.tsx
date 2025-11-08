import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnnouncementsPanel } from "@/components/AnnouncementsPanel";
import { FlightsPanel } from "@/components/FlightsPanel";
import { UserManagementPanel } from "@/components/UserManagementPanel";

// Use root-relative path for logo
import LogoImage from "/Background.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (!session) navigate("/auth");
      });

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentSession.user.id);

        setIsAdmin(roles?.some(r => r.role === "admin") ?? false);
      }

      setLoading(false);
      return () => subscription.unsubscribe();
    };

    setupAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <img src={LogoImage} alt="FlyPrague Logo" className="h-16 w-16 animate-pulse mb-4" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-gradient-aviation shadow-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LogoImage} alt="FlyPrague Logo" className="h-10 w-10" />
            <h1 className="text-xl font-bold text-white">FlyPrague</h1>
          </div>
          <Button onClick={handleLogout} size="sm">
            Logout
          </Button>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnnouncementsPanel isAdmin={isAdmin} />
          <FlightsPanel isAdmin={isAdmin} />
        </div>

        {isAdmin && (
          <div className="mt-8">
            <UserManagementPanel />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
