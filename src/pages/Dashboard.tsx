import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Bell, Calendar, LogOut, RefreshCw } from "lucide-react";
import { UserManagementPanel } from "@/components/UserManagementPanel";
import BackgroundImage from "/Background.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [fullName, setFullName] = useState("User");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showUserManagement, setShowUserManagement] = useState(false);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);
  const [deletingFlightId, setDeletingFlightId] = useState<string | null>(null);

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

  const fetchAllData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    await Promise.all([fetchAnnouncements(), fetchFlights()]);
    if (isManual) setIsRefreshing(false);
  };

  useEffect(() => {
    let subscription: any;

    const init = async () => {
      try {
        subscription = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession);
          if (!newSession) navigate("/auth", { replace: true });
        }).data.subscription;

        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession?.user) {
          navigate("/auth", { replace: true });
          return;
        }

        setSession(currentSession);

        const userId = currentSession.user.id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();
        setFullName(profile?.full_name || "User");

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        const adminFlag = roles?.some(r => r.role === "admin") ?? false;
        setIsAdmin(adminFlag);
        if (adminFlag) setShowUserManagement(true);

        await fetchAllData();

        const interval = setInterval(() => fetchAllData(false), 10000);
        return () => clearInterval(interval);

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
      await supabase.auth.signOut();
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

  const handleDeleteAnnouncement = async (id: string) => {
    setDeletingAnnouncementId(id);
    // Replace with your actual delete logic (e.g., API call to delete from database)
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      setDeletingAnnouncementId(null);
      toast.success("Announcement deleted");
    }, 500); // Match animation duration
  };

  const handleDeleteFlight = async (id: string) => {
    setDeletingFlightId(id);
    // Replace with your actual delete logic (e.g., API call to delete from database)
    setTimeout(() => {
      setFlights(prev => prev.filter(f => f.id !== id));
      setDeletingFlightId(null);
      toast.success("Flight deleted");
    }, 500); // Match animation duration
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center"
        style={{ backgroundImage: `url(${BackgroundImage})` }}
      >
        <header className="shadow sticky top-0 z-10 bg-card border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Welcome, {fullName}</h1>

            <div className="flex items-center gap-4">
              <button
                disabled
                className="flex items-center px-4 py-2 border rounded-lg bg-gray-400 border-gray-400 text-white cursor-not-allowed"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 border rounded-lg bg-red-600 border-red-600 text-white
                transition-all duration-300 ease-in-out transform hover:bg-red-700 hover:shadow-lg hover:scale-105 active:scale-95 hover:-rotate-1"
              >
                <LogOut className="h-5 w-5 mr-2 transition-transform duration-200 hover:translate-x-1" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg shadow-sm border p-6 flex items-center gap-4">
              <div className="h-6 w-6 bg-gray-300 rounded animate-pulse"></div>
              <div>
                <div className="h-4 w-16 bg-gray-300 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-32 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border p-6 flex items-center gap-4">
              <div className="h-6 w-6 bg-gray-300 rounded animate-pulse"></div>
              <div>
                <div className="h-4 w-20 bg-gray-300 rounded animate-pulse mb-2"></div>
                <div className="h-6 w-20 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="space-y-4">
                <div className="h-6 w-40 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="space-y-4">
                <div className="h-6 w-32 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {showUserManagement && (
            <div className="mt-8 bg-card rounded-lg shadow-sm border p-6">
              <div className="space-y-4">
                <div className="h-6 w-48 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-4/5 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      <header className="shadow sticky top-0 z-10 bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Welcome, {fullName}</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchAllData(true)}
              disabled={isRefreshing}
              className={`flex items-center px-4 py-2 border rounded-lg text-white transition-all duration-300 ease-in-out transform 
                ${isRefreshing 
                  ? "bg-blue-400 border-blue-400 cursor-not-allowed animate-pulse" 
                  : "bg-blue-600 border-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-105 active:scale-95 hover:rotate-1"
                }`}
            >
              {isRefreshing ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 mr-2 transition-transform duration-200 hover:rotate-180" />
              )}
              {isRefreshing ? "Loading..." : "Refresh"}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 border rounded-lg bg-red-600 border-red-600 text-white
              transition-all duration-300 ease-in-out transform hover:bg-red-700 hover:shadow-lg hover:scale-105 active:scale-95 hover:-rotate-1"
            >
              <LogOut className="h-5 w-5 mr-2 transition-transform duration-200 hover:translate-x-1" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg shadow-sm border p-6 flex items-center gap-4 transition-all duration-300 ease-in-out transform hover:shadow-md hover:scale-102 hover:-translate-y-1">
            <Bell className="h-6 w-6 text-primary transition-transform duration-200 hover:scale-110" />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-foreground">Announcements</p>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border p-6 flex items-center gap-4 transition-all duration-300 ease-in-out transform hover:shadow-md hover:scale-102 hover:-translate-y-1">
            <Calendar className="h-6 w-6 text-primary transition-transform duration-200 hover:scale-110" />
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-xl font-bold text-foreground">Flights</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-lg shadow-sm border p-6 transition-all duration-500 ease-in-out animate-fade-in-up">
            <div>
              <h2 className="text-lg font-semibold mb-4">Announcements</h2>
              <ul className="space-y-4">
                {announcements.map((announcement) => (
                  <li
                    key={announcement.id}
                    className={`p-4 border rounded-lg transition-all duration-300 ease-in-out ${
                      deletingAnnouncementId === announcement.id ? "animate-fade-out-up" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{announcement.title}</h3>
                        <p className="text-sm text-muted-foreground">{announcement.content}</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="delete-btn text-red-500 hover:text-red-700 transition-colors duration-200"
                          onMouseEnter={(e) => {
                            const item = e.currentTarget.closest("li");
                            if (item) item.classList.add("bg-red-500", "text-white", "!text-white");
                          }}
                          onMouseLeave={(e) => {
                            const item = e.currentTarget.closest("li");
                            if (item) item.classList.remove("bg-red-500", "text-white", "!text-white");
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {/* Add create form if needed */}
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-sm border p-6 transition-all duration-500 ease-in-out animate-fade-in-up animation-delay-200">
            <div>
              <h2 className="text-lg font-semibold mb-4">Flights</h2>
              <ul className="space-y-4">
                {flights.map((flight) => (
                  <li
                    key={flight.id}
                    className={`p-4 border rounded-lg transition-all duration-300 ease-in-out ${
                      deletingFlightId === flight.id ? "animate-fade-out-up" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{flight.title}</h3>
                        <p className="text-sm text-muted-foreground">{flight.content}</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteFlight(flight.id)}
                          className="delete-btn text-red-500 hover:text-red-700 transition-colors duration-200"
                          onMouseEnter={(e) => {
                            const item = e.currentTarget.closest("li");
                            if (item) item.classList.add("bg-red-500", "text-white", "!text-white");
                          }}
                          onMouseLeave={(e) => {
                            const item = e.currentTarget.closest("li");
                            if (item) item.classList.remove("bg-red-500", "text-white", "!text-white");
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {/* Add create form if needed */}
            </div>
          </div>
        </div>

        {showUserManagement && (
          <div className="mt-8 bg-card rounded-lg shadow-sm border p-6 transition-all duration-500 ease-in-out animate-fade-in-up animation-delay-400">
            <UserManagementPanel />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
