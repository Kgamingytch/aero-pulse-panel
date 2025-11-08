import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Both images in public folder
const BackgroundImage = "/Background.png";
const LogoImage = "/FlyPrague_logo_png.png";

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
      <div className="text-center space-y-8 bg-white bg-opacity-80 rounded-2xl p-8 shadow-lg">

        {/* LOGO */}
        <img 
          src={LogoImage}
          alt="FlyPrague Logo"
          className="h-24 w-auto mx-auto"
        />

        {/* TITLE */}
        <h1 className="text-5xl font-bold text-gray-900">
          FlyPrague
        </h1>

        {/* LOGIN BUTTON */}
        <Button
          size="lg"
          variant="default"
          onClick={() => navigate("/auth")}
          className="text-lg px-10 bg-blue-500 text-white hover:bg-blue-600"
        >
          Log-In
        </Button>

      </div>
    </div>
  );
};

export default Index;
