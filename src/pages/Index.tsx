import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const BackgroundImage = "/Background.png";
const LogoImage = "/FlyPrague_logo_png.png";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

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
      <div className="text-center space-y-8 bg-white bg-opacity-95 rounded-2xl p-10 shadow-lg max-w-md w-full">

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

        {/* EMAIL FIELD */}
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
        />

        {/* LOGIN BUTTON */}
        <Button
          size="lg"
          variant="default"
          onClick={() => navigate("/auth")}
          className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-600 transition"
        >
          Log-In
        </Button>

      </div>
    </div>
  );
};

export default Index;
