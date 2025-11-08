import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Background from public
const BackgroundImage = "/Background.png";
// Logo image
import LogoImage from "/FlyPrague_logo_png.png";

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
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      <div className="text-center space-y-8 backdrop-blur-[1px] px-4">

        {/* LOGO - no background circle */}
        <img 
          src={LogoImage} 
          alt="FlyPrague Logo" 
          className="h-24 w-auto mx-auto"
        />

        {/* Title */}
        <h1 className="text-5xl font-bold text-white drop-shadow">
          FlyPrague
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-white/90 drop-shadow">
          Welcome to the FlyPrague Crew Dashboard.
        </p>

        {/* Login Button */}
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
  );
};

export default Index;
