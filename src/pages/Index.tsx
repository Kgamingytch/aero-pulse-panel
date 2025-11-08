import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// IMPORT YOUR IMAGES
import BackgroundImage from "@/public/Background.png"; // Image 1
import LogoImage from "@/assets/FlyPrague_logo_png.png"; // Image 2

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    };
    checkUser();
  }, [navigate]);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      <div className="container mx-auto px-4 py-20 text-center space-y-8 backdrop-blur-[2px]">
        
        {/* LOGO IMAGE REPLACING PLANE ICON */}
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
          <img src={LogoImage} alt="FlyPrague Logo" className="h-14 w-14" />
        </div>

        {/* TITLE + SUBTEXT */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white drop-shadow-md">
            FlyPrague
          </h1>
          <p className="text-lg text-white/90 drop-shadow-md">
            Welcome to the FlyPrague Crew Dashboard.
          </p>
        </div>

        {/* LOGIN BUTTON */}
        <div className="pt-6">
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg px-10"
          >
            Log-In
          </Button>
        </div>

      </div>
    </div>
  );
};

export default Index;
