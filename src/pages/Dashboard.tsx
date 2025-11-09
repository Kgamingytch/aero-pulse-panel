import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Bell, Calendar, LogOut, RefreshCw } from "lucide-react";
import { AnnouncementsPanel } from "@/components/AnnouncementsPanel";
import { FlightsPanel } from "@/components/FlightsPanel";
import { UserManagementPanel } from "@/components/UserManagementPanel";

import BackgroundImage from "/Background.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [fullName, setFullName] = useState("User");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showUserManagement, setShowUserManagement] = useState(false);

  // Data states
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);

  // Fetch functions
  const fetchAnnouncements = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      toast.error("Unable to fetch announcements");
    }
  };

  const fetchFlights = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from("flights")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFlights(data || []);
    } catch (err) {
      console.error("Failed to fetch flights:", err);
      toast.error("Unable to fetch flights");
    }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchAnnouncements(), fetchFlights()]);
  };

  useEffect(() => {
    let subscription: any;

    const init = async () => {
      try {
        subscription = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession);
          if (!newSession) navigate("/auth", { replace: true });
        }).data.subscription;

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

        if (adminFlag) setShowUserManagement(true);

        // Initial data fetch
        await fetchAllData();

        // Poll every 10 seconds
        const interval = setInterval(() => {
          fetchAllData();
        }, 10000);

        return () => clearInterval(interval);

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

  const createFlight = async (title: string, content: string, priority: number) => {
    if (!session?.user) return;
    const { error } = await supabase.from("flights").insert([{
      title, content, priority,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);
    if (error) toast.error("Failed to create flight");
    else toast.success("Flight created successfully");
    await fetchFlights();
  };

  const createAnnouncement = async (title: string, content: string, priority: number) => {
    if (!session?.user) return;
    const { error } = await supabase.from("announcements").insert([{
      title, content, priority,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);
    if (error) toast.error("Failed to create announcement");
    else toast.success("Announcement created successfully");
    await fetchAnnouncements();
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundImage: `url(${BackgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <p className="text-foreground text-xl animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      {/* HEADER */}
      <header className="shadow sticky top-0 z-10 bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            Welcome, {fullName}
          </h1>
          <div className="flex items-center gap-4">
            {/* Manual Refresh */}
            <button
              onClick={fetchAllData}
              className="flex items-center px-3 py-1 border rounded bg-blue-600 text-white border-blue-600"
            >
              <RefreshCw className="h-4 w-4 mr-2 text-white" />
              Refresh
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-1 border rounded bg-red-600 text-white border-red-600"
            >
              <LogOut className="h-4 w-4 mr-2 text-white" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Status cards */}
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
            <AnnouncementsPanel isAdmin={isAdmin} onCreate={createAnnouncement} data={announcements} />
          </div>
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <FlightsPanel isAdmin={isAdmin} onCreate={createFlight} data={flights} />
          </div>
        </div>

        {/* Toggleable User Management Panel */}
        {showUserManagement && (
          <div className="mt-8 bg-card rounded-lg shadow-sm border p-6">
            <UserManagementPanel />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
