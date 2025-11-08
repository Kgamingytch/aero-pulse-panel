import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Bell, Calendar, LogOut } from "lucide-react";
import { AnnouncementsPanel } from "@/components/AnnouncementsPanel";
import { FlightsPanel } from "@/components/FlightsPanel";
import { UserManagementPanel } from "@/components/UserManagementPanel";

// Background image
import BackgroundImage from "/Background.png";

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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${BackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <p className="text-gray-800 text-xl animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${BackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* HEADER */}
      <header className="shadow-card sticky top-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">FlyPrague</h1>
          <Button onClick={handleLogout} size="sm" variant="outline">
            <LogOut className="h-4 w-4 mr-2 text-gray-800" />
            Logout
          </Button>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-lg shadow p-6 flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center">
              <Bell className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-800">Announcements</p>
            </div>
          </div>

          <div className="bg-white/80 rounded-lg shadow p-6 flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-800">Flights</p>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-white/80 rounded-lg shadow p-6 flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center">
                <Users className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Admin</p>
                <p className="text-2xl font-bold text-gray-800">Dashboard</p>
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
