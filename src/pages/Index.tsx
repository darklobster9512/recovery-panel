import { useEffect, useState, useRef } from "react";
import { Shield, Key, HardDrive } from "lucide-react";

const PARTICLE_COUNT = 40;

const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 5,
  duration: Math.random() * 4 + 4,
}));

const GlitchText = ({ text }: { text: string }) => (
  <span className="relative inline-block">
    <span className="relative z-10">{text}</span>
    <span
      aria-hidden
      className="absolute inset-0 text-neon-cyan opacity-80"
      style={{ animation: "glitch-1 3s infinite linear" }}
    >
      {text}
    </span>
    <span
      aria-hidden
      className="absolute inset-0 text-neon-green opacity-80"
      style={{ animation: "glitch-2 3s infinite linear 0.15s" }}
    >
      {text}
    </span>
  </span>
);

const TypingText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [started, text]);

  return (
    <span
      className="font-mono border-r-2 border-primary pr-1"
      style={{ animation: "typing-cursor 0.8s step-end infinite" }}
    >
      {displayed}
    </span>
  );
};

const features = [
  { icon: Shield, label: "Lost Wallet", desc: "We recover access to lost or inaccessible wallets." },
  { icon: Key, label: "Forgotten Password", desc: "Retrieve your crypto from password-locked accounts." },
  { icon: HardDrive, label: "Damaged Device", desc: "Extract keys from broken or corrupted hardware." },
];

const Index = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center">
      {/* Gradient Orbs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, hsl(186 100% 50% / 0.35) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "orb-move-1 12s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, hsl(152 100% 50% / 0.3) 0%, transparent 70%)",
          filter: "blur(100px)",
          animation: "orb-move-2 15s ease-in-out infinite",
        }}
      />

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none absolute rounded-full bg-primary"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            opacity: 0.3,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Connecting lines between some particles */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-10">
        {particles.slice(0, 15).map((p, i) => {
          const next = particles[(i + 3) % particles.length];
          return (
            <line
              key={i}
              x1={`${p.left}%`}
              y1={`${p.top}%`}
              x2={`${next.left}%`}
              y2={`${next.top}%`}
              stroke="hsl(186 100% 50%)"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>

      {/* Scan Line */}
      <div
        className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-40"
        style={{ animation: "scan-line 4s linear infinite" }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Headline */}
        <h1
          className={`mb-6 font-display text-5xl font-bold leading-tight tracking-tight text-foreground transition-all duration-1000 sm:text-7xl lg:text-8xl ${
            visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ animation: visible ? "text-glow-pulse 3s ease-in-out infinite" : "none" }}
        >
          <GlitchText text="Recover Your" />
          <br />
          <span className="text-primary">Crypto</span>
        </h1>

        {/* Typing subtitle */}
        <div
          className={`mb-12 text-lg text-muted-foreground transition-all delay-500 duration-1000 sm:text-xl ${
            visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <TypingText
            text="Professional crypto asset recovery — fast, secure, confidential."
            delay={800}
          />
        </div>

        {/* Features */}
        <div
          className={`mb-14 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10 transition-all delay-700 duration-1000 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          {features.map((f, i) => (
            <div
              key={f.label}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-6 py-5 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-[0_0_30px_hsl(186_100%_50%/0.15)]"
              style={{ animation: `feature-float ${3 + i * 0.5}s ease-in-out infinite ${i * 0.3}s` }}
            >
              <f.icon className="h-8 w-8 text-primary transition-colors group-hover:text-neon-green" />
              <span className="font-display text-sm font-semibold text-foreground">{f.label}</span>
              <span className="max-w-[180px] text-xs text-muted-foreground">{f.desc}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`transition-all delay-1000 duration-1000 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <button
            className="relative inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-8 py-4 font-display text-lg font-semibold text-primary backdrop-blur-sm transition-all hover:bg-primary/20 hover:scale-105"
            style={{ animation: "pulse-glow 2.5s ease-in-out infinite" }}
          >
            <span className="relative z-10">Start Recovery</span>
            <span className="relative z-10">→</span>
          </button>
        </div>

        {/* Bottom tagline */}
        <p
          className={`mt-10 font-mono text-xs text-muted-foreground/60 transition-all delay-[1200ms] duration-1000 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          256-bit encryption • 99.2% success rate • 24/7 support
        </p>
      </div>
    </div>
  );
};

export default Index;
