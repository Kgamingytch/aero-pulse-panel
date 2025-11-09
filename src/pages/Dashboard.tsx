import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Background image
const BackgroundImage = "/Background.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const { data: ann } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      const { data: flt } = await supabase.from("flights").select("*").order("created_at", { ascending: false });

      setAnnouncements(ann || []);
      setFlights(flt || []);

      toast.success("Data refreshed");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/");
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center p-6"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-black drop-shadow">Dashboard</h1>

        <div className="flex gap-3">
          {/* Manual Refresh */}
          <Button
            onClick={fetchData}
            disabled={isRefreshing}
            className={`px-4 py-2 border border-black text-black bg-white hover:bg-white transition-all ${
              isRefreshing ? "scale-95" : "scale-100"
            }`}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white border border-red-700 hover:bg-red-600 active:scale-95 transition-all"
          >
            Log Out
          </Button>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Announcements */}
        <Card className="bg-white/90 backdrop-blur border border-gray-300">
          <CardHeader>
            <CardTitle className="text-black">Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.length === 0 && (
              <p classname="text-gray-500">No announcements available.</p>
            )}
            {announcements.map((a) => (
              <div key={a.id} className="p-3 bg-gray-100 rounded border border-gray-300">
                <p className="font-semibold text-black">{a.title}</p>
                <p className="text-gray-700 text-sm">{a.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Flights */}
        <Card className="bg-white/90 backdrop-blur border border-gray-300">
          <CardHeader>
            <CardTitle className="text-black">Flights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {flights.length === 0 && (
              <p className="text-gray-500">No flights available.</p>
            )}
            {flights.map((f) => (
              <div key={f.id} className="p-3 bg-gray-100 rounded border border-gray-300">
                <p className="font-semibold text-black">{f.flight_number}</p>
                <p className="text-gray-700 text-sm">{f.destination}</p>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
