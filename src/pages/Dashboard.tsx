import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plane, LogOut, Users, Bell, Calendar } from "lucide-react";
import { AnnouncementsPanel } from "@/components/AnnouncementsPanel";
import { FlightsPanel } from "@/components/FlightsPanel";
import { UserManagementPanel } from "@/components/UserManagementPanel";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          if (!session) {
            navigate("/auth");
          }
        }
      );

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
        <div className="text-center">
          <Plane className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-aviation shadow-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Airline Management</h1>
              <p className="text-sm text-white/80">Welcome back!</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="secondary" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg shadow-card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">Announcements</p>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold">Flights</p>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-card rounded-lg shadow-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admin</p>
                <p className="text-2xl font-bold">Dashboard</p>
              </div>
            </div>
          )}
        </div>

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
