import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plane, Users, Bell, Calendar } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-aviation">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Plane className="h-10 w-10 text-white" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white">
              Airline Management System
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Streamline your airline operations with our comprehensive management platform.
              Manage users, track flights, and communicate with your team in real-time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Get Started
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <Users className="h-8 w-8 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">User Management</h3>
              <p className="text-white/80 text-sm">
                Create and manage user accounts with role-based access control
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <Bell className="h-8 w-8 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Announcements</h3>
              <p className="text-white/80 text-sm">
                Keep your team informed with real-time announcements and updates
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <Calendar className="h-8 w-8 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Flight Tracking</h3>
              <p className="text-white/80 text-sm">
                Monitor upcoming flights with detailed schedule information
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
