import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Landmark, Briefcase, Eye, EyeOff } from "lucide-react";

import europolLogo from "@/assets/europol-logo.png";
import ioscoLogoAsset from "@/assets/iosco-logo.png.asset.json";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, role, navigate]);

  const translateAuthError = (err: any): string => {
    const msg = String(err?.message ?? "").toLowerCase();
    if (msg.includes("invalid login credentials")) return "E-Mail oder Passwort ist falsch.";
    if (msg.includes("email not confirmed")) return "Bitte bestätige zuerst deine E-Mail-Adresse.";
    if (msg.includes("user already registered")) return "Für diese E-Mail-Adresse existiert bereits ein Konto.";
    if (msg.includes("password should be at least")) return "Das Passwort muss mindestens 6 Zeichen lang sein.";
    if (msg.includes("unable to validate email address")) return "Ungültige E-Mail-Adresse.";
    if (msg.includes("email rate limit")) return "Zu viele Anfragen. Bitte versuche es später erneut.";
    if (msg.includes("signup is disabled") || msg.includes("signups not allowed")) return "Registrierung ist derzeit deaktiviert.";
    if (msg.includes("invalid email")) return "Ungültige E-Mail-Adresse.";
    if (msg.includes("network")) return "Netzwerkfehler. Bitte überprüfe deine Verbindung.";
    return "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Konto erstellt. Bitte bestätige deine E-Mail-Adresse, um dich anzumelden.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl w-full flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden bg-white min-h-[800px]">
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
              {mode === "login" ? "Willkommen zurück" : "Konto erstellen"}
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              {mode === "login"
                ? "Melde dich an, um auf dein Dashboard zuzugreifen."
                : "Registriere dich mit E-Mail und Passwort."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                  setInfo("");
                }}
                className={`h-9 rounded-md text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "login" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
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

            {info && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">{info}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-[hsl(221,100%,50%)] hover:bg-[hsl(221,100%,45%)] text-white font-medium text-sm"
            >
              {loading ? "Laden..." : mode === "login" ? "Anmelden" : "Konto erstellen"}
            </Button>

          </form>
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
          <div className="relative w-64 h-64 mb-12">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20"
              style={{ animation: "auth-float-1 6s ease-in-out infinite" }}
            >
              <Scale className="w-10 h-10 text-white" />
            </div>
            <div
              className="absolute bottom-8 left-4 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20"
              style={{ animation: "auth-float-2 7s ease-in-out infinite" }}
            >
              <Landmark className="w-8 h-8 text-white" />
            </div>
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

          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 px-6 py-4 mb-10 max-w-sm text-center">
            <p className="text-white/90 text-sm italic">
              „Über 500 erfolgreiche Rückgewinnungen in Zusammenarbeit mit Europol, BaFin & SEC."
            </p>
          </div>

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
    </div>
  );
}
