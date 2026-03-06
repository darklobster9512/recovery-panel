import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Landmark, Briefcase, Eye, EyeOff, Shield } from "lucide-react";
import { useEffect } from "react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setSuccess("Bestätigungsmail gesendet! Bitte prüfe dein Postfach.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white text-gray-900">
      {/* Left — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-[hsl(221,100%,50%)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">RecoveryPanel</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {isLogin ? "Willkommen zurück" : "Konto erstellen"}
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              {isLogin
                ? "Melde dich an, um auf dein Dashboard zuzugreifen."
                : "Erstelle ein Konto, um loszulegen."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-[hsl(221,100%,50%)] focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Passwort
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-[hsl(221,100%,50%)] focus-visible:ring-offset-0 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">{success}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-[hsl(221,100%,50%)] hover:bg-[hsl(221,100%,45%)] text-white font-medium text-sm"
            >
              {loading ? "Laden..." : isLogin ? "Anmelden" : "Registrieren"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            {isLogin ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
              }}
              className="text-[hsl(221,100%,50%)] hover:underline font-medium"
            >
              {isLogin ? "Registrieren" : "Anmelden"}
            </button>
          </p>
        </div>
      </div>

      {/* Right — Trust Animation */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-[hsl(221,100%,50%)] to-[hsl(221,100%,35%)]">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Floating elements */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          {/* Animated icons */}
          <div className="relative w-64 h-64 mb-12">
            {/* Scale - Justiz */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20"
              style={{ animation: "auth-float-1 6s ease-in-out infinite" }}
            >
              <Scale className="w-10 h-10 text-white" />
            </div>
            {/* Landmark - Behörde */}
            <div
              className="absolute bottom-8 left-4 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20"
              style={{ animation: "auth-float-2 7s ease-in-out infinite" }}
            >
              <Landmark className="w-8 h-8 text-white" />
            </div>
            {/* Briefcase - Anwalt */}
            <div
              className="absolute bottom-4 right-4 w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20"
              style={{ animation: "auth-float-3 5s ease-in-out infinite" }}
            >
              <Briefcase className="w-7 h-7 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-3">
            Rechtlich. Sicher. Erfolgreich.
          </h2>
          <p className="text-white/70 text-center text-sm max-w-xs mb-6">
            Unsere Kanzlei arbeitet eng mit Strafverfolgungsbehörden und Regulierungsstellen zusammen, um Ihre Krypto-Assets rechtssicher zurückzugewinnen.
          </p>

          {/* Erfolgsquote */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 px-6 py-4 mb-10 max-w-sm text-center">
            <p className="text-white/90 text-sm italic">
              „Über 500 erfolgreiche Rückgewinnungen in Zusammenarbeit mit Europol, BaFin & SEC."
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex gap-4">
            {["Behördliche Kooperation", "Zugelassene Anwälte", "Internationale Jurisdiktion"].map(
              (badge) => (
                <div
                  key={badge}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-xs font-medium"
                >
                  {badge}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
