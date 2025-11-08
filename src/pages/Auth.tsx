import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Images from public
const BackgroundImage = "/Background.png";
const LogoImage = "/FlyPrague_logo_png.png";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard");
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        toast.error("Invalid email or password");
        return;
      }

      if (data.session) {
        toast.success("Logged in successfully!");
        navigate("/dashboard");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ backgroundImage: `url(${BackgroundImage})` }}
    >
      <div className="text-center space-y-8 backdrop-blur-[1px] px-6 py-10 rounded-lg">

        {/* LOGO */}
        <img
          src={LogoImage}
          alt="FlyPrague Logo"
          className="h-24 w-auto mx-auto"
        />

        {/* TITLE */}
        <h1 className="text-4xl font-bold text-white drop-shadow">
          FlyPrague
        </h1>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto text-left">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-white">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-white">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Log-In"}
          </Button>
        </form>

      </div>
    </div>
  );
};

export default Auth;
