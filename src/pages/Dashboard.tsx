import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { AnnouncementsPanel } from "@/components/AnnouncementsPanel";
import { FlightsPanel } from "@/components/FlightsPanel";
import { UserManagementPanel } from "@/components/UserManagementPanel";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [fullName, setFullName] = useState("User");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let subscription: any;

    const init = async () => {
      try {
        // Listen for auth state changes
        subscription = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession);
          if (!newSession) navigate("/auth", { replace: true });
        }).data.subscription;

        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!currentSession?.user) {
          navigate("/auth", { replace: true });
          return;
        }

        setSession(currentSession);
        const userId = currentSession.user.id;

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();
        if (profileError) throw profileError;
        setFullName(profile?.full_name || "User");

        // Fetch user roles
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (rolesError) throw rolesError;
        const adminFlag = roles?.some(r => r.role === "admin") ?? false;
        setIsAdmin(adminFlag);

        // Show welcome animation
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 2500);

      } catch (err: any) {
        console.error("Unable to fetch profile or roles:", err.message || err);
        toast.error("Unable to fetch user data. Please check your permissions.");
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
      navigate("/auth", { replace: true });
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Failed to log out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground text-xl animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Animation */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="text-center space-y-4 animate-scale-in">
            <h1 className="text-5xl font-bold text-primary">
              Welcome back, {fullName}
            </h1>
            <p className="text-lg text-muted-foreground">
              FlyPrague Dashboard
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Loading your dashboard...</span>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="shadow sticky top-0 z-10 bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
          Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {fullName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <AnnouncementsPanel isAdmin={isAdmin} />
          </div>
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <FlightsPanel isAdmin={isAdmin} />
          </div>
        </div>

        {/* User Management Panel */}
        {isAdmin && (
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <UserManagementPanel />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
