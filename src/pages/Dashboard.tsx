import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Bell, Calendar, LogOut, RefreshCw } from "lucide-react";
import { AnnouncementsPanel } from "@/components/AnnouncementsPanel";
import { FlightsPanel } from "@/components/FlightsPanel";

const BackgroundImage = "/Background.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);

  // Fetch full_name from profiles
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    if (data?.full_name) setFullName(data.full_name);
  };

  // Fetch admin role
  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setIsAdmin(data?.some(r => r.role === "admin") ?? false);
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return;
    setAnnouncements(data || []);
  };

  // Fetch flights
  const fetchFlights = async () => {
    const { data, error } = await supabase
      .from("flights")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return;
    setFlights(data || []);
  };

  const fetchAllData = async () => {
    if (!session?.user) return;
    await Promise.all([fetchAnnouncements(), fetchFlights()]);
  };

  // Auth + initial data load
  useEffect(() => {
    const load = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) return navigate("/auth");
      setSession(s);

      await fetchProfile(s.user.id);
      await fetchRole(s.user.id);
      await fetchAllData();

      setLoading(false);
    };

    load();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out!");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      {/* HEADER */}
      <header className="shadow bg-black/60 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between text-white">

          <h1 className="text-xl font-bold">
            Welcome, {fullName || "User"}
          </h1>

          <div className="flex items-center gap-4">
            {/* Refresh */}
            <button
              onClick={async () => {
                await fetchAllData();
                toast.success("Refreshed!");
              }}
              className="flex items-center px-3 py-1 border rounded bg-blue-600 text-white border-blue-600 
                         transition-transform duration-150 active:scale-95 select-none shadow-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2 text-white" />
              Refresh
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-1 border rounded bg-red-600 text-white border-red-600 
                         transition-transform duration-150 active:scale-95 select-none shadow-sm"
            >
              <LogOut className="h-4 w-4 mr-2 text-white" />
              Logout
            </button>
          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8 space-y-8">

        {/* Status Header */}
        <div className="bg-black/40 backdrop-blur-sm text-white rounded-lg shadow-sm border border-white/20 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <Bell className="h-6 w-6 text-yellow-300" />
            <p className="text-xl font-semibold">Announcements</p>
          </div>

          <div className="flex items-center gap-4">
            <Calendar className="h-6 w-6 text-blue-300" />
            <p className="text-xl font-semibold">Flights</p>
          </div>
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-white/20 p-6 text-white">
            <AnnouncementsPanel isAdmin={isAdmin} data={announcements} />
          </div>
          <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-white/20 p-6 text-white">
            <FlightsPanel isAdmin={isAdmin} data={flights} />
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
