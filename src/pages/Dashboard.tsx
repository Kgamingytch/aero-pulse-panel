import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Users, Bell, Calendar, LogOut } from "lucide-react";
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
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (!session) navigate("/auth");
      });

      // Get current session
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error);
      }
      setSession(currentSession);

      // Check if user is admin
      if (currentSession?.user) {
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentSession.user.id);

        if (rolesError) console.error("Error fetching roles:", rolesError);

        setIsAdmin(roles?.some(r => r.role === "admin") ?? false);
      }

      setLoading(false);
      return () => subscription.unsubscribe();
    };

    setupAuth();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  // Helpers for creating Flights and Announcements
  const createFlight = async (title: string, content: string, priority: number) => {
    if (!session?.user) return;

    const { error } = await supabase.from("flights").insert([{
      title,
      content,
      priority,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);

    if (error) {
      console.error(error);
      toast.error("Failed to create flight. Check console.");
    } else {
      toast.success("Flight created successfully");
    }
  };

  const createAnnouncement = async (title: string, content: string, priority: number) => {
    if (!session?.user) return;

    const { error } = await supabase.from("announcements").insert([{
      title,
      content,
      priority,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);

    if (error) {
      console.error(error);
      toast.error("Failed to create announcement. Check console.");
    } else {
      toast.success("Announcement created successfully");
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
      {/* HEADER */}
      <header className="shadow sticky top-0 z-10 bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">FlyPrague</h1>
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-1 border rounded hover:bg-gray-100 transition"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg shadow-sm border p-6 flex items-center gap-4">
            <Bell className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-foreground">Announcements</p>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border p-6 flex items-center gap-4">
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-xl font-bold text-foreground">Flights</p>
            </div>
          </div>
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <AnnouncementsPanel isAdmin={isAdmin} onCreate={createAnnouncement} />
          </div>
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <FlightsPanel isAdmin={isAdmin} onCreate={createFlight} />
          </div>
        </div>

        {isAdmin && (
          <div className="mt-8 bg-card rounded-lg shadow-sm border p-6">
            <UserManagementPanel />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
