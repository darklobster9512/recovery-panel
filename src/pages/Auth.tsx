import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Landmark, Briefcase, Eye, EyeOff } from "lucide-react";

const europolLogo = "/europol-logo.png";
const ioscoLogo = "/iosco-logo.png";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const preload = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });
    Promise.all([preload(ioscoLogo), preload(europolLogo)]).then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user && role) {
      navigate(role === "admin" || role === "caller" ? "/admin" : "/dashboard", { replace: true });
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
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };


  if (!assetsReady) {
    return <div className="min-h-screen bg-[#f8fafc]" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-6xl w-full flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden bg-white min-h-[800px]">
        {/* Left — Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8 flex-1 flex flex-col justify-center">
          {/* Logo */}
          <div className="mb-10">
            <span className="font-serif text-xl tracking-tight text-[#0b1f3a] block">
              Korte <span className="text-[#c9a24a]">&amp;</span> Partner
            </span>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-500">Rechtsanwaltskanzlei</p>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0b1f3a]">
              Willkommen zurück
            </h1>
            <p className="mt-2 text-slate-500 text-sm">
              Melde dich an, um auf dein Dashboard zuzugreifen.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-lg border-slate-200 bg-white text-[#0b1f3a] placeholder:text-slate-400 focus-visible:ring-[#0b1f3a] focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
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
                  className="h-11 rounded-lg border-slate-200 bg-white text-[#0b1f3a] placeholder:text-slate-400 focus-visible:ring-[#0b1f3a] focus-visible:ring-offset-0 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-[#0b1f3a] hover:bg-[#0b1f3a]/90 text-white font-medium text-sm"
            >
              {loading ? "Laden..." : "Anmelden"}
            </Button>

          </form>

          {/* Cooperation logos */}
          <div className="pt-8 mt-auto">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center mb-4">In Kooperation mit</p>
            <div className="flex flex-col items-center justify-center gap-3">
              <img
                src={ioscoLogo}
                alt="IOSCO"
                loading="eager"
                decoding="sync"
                className="h-10 w-auto object-contain"
              />
              <img
                src={europolLogo}
                alt="Europol"
                loading="eager"
                decoding="sync"
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right — Trust Animation */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0b1f3a] to-[#174ea6]">
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
