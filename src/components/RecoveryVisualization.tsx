import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, User, Wallet, Shuffle, Building2, ShieldCheck, BookOpen } from "lucide-react";

interface Props {
  onOpenGuide?: () => void;
}

type NodeKind = "victim" | "wallet" | "mixer" | "exchange" | "culprit";

interface GNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  label?: string;
  sub?: string;
  phase: number; // phase at which node becomes "active"
}

interface GEdge {
  from: string;
  to: string;
  amount: string;
  date: string;
  phase: number; // phase at which edge draws
}

const PHASES = [
  { title: "Ausgangspunkt", text: "Ihre Kryptowährung wurde entwendet. Wir sichern die ursprüngliche Transaktion." },
  { title: "Erste Spur", text: "Wir folgen den ersten Transaktionen unmittelbar nach dem Vorfall on-chain." },
  { title: "Verschleierung", text: "Mixer, Peel-Chains und Splits werden identifiziert und analysiert." },
  { title: "Cluster-Analyse", text: "Verknüpfte Wallets werden demselben Akteur zugeordnet." },
  { title: "Exchange-Treffer", text: "Coins erreichen eine regulierte Börse mit KYC-Pflicht." },
  { title: "Identifikation", text: "Die Täteridentität wird über Behörden angefordert – die Rückführung wird eingeleitet." },
];

const PHASE_MS = 3200;

// Layout: 6 columns, compact viewBox 920x440
const NODES: GNode[] = [
  { id: "victim", kind: "victim", x: 60, y: 220, label: "Opfer", sub: "Sie", phase: 1 },

  { id: "w1a", kind: "wallet", x: 210, y: 120, sub: "0x4a…f21", phase: 2 },
  { id: "w1b", kind: "wallet", x: 210, y: 220, sub: "0x9c…a08", phase: 2 },
  { id: "w1c", kind: "wallet", x: 210, y: 320, sub: "0x71…3de", phase: 2 },

  { id: "mix", kind: "mixer", x: 380, y: 170, label: "Mixer", sub: "Verschleierung", phase: 3 },
  { id: "mix2", kind: "mixer", x: 380, y: 290, label: "Peel-Chain", sub: "Splits", phase: 3 },

  { id: "w2a", kind: "wallet", x: 550, y: 120, sub: "0x22…b91", phase: 4 },
  { id: "w2b", kind: "wallet", x: 550, y: 220, sub: "0xde…12c", phase: 4 },
  { id: "w2c", kind: "wallet", x: 550, y: 320, sub: "0x08…7aa", phase: 4 },

  { id: "ex", kind: "exchange", x: 720, y: 220, label: "Exchange", sub: "KYC-Pflicht", phase: 5 },

  { id: "culprit", kind: "culprit", x: 860, y: 220, label: "Täter", sub: "Identifiziert", phase: 6 },
];

const EDGES: GEdge[] = [
  { from: "victim", to: "w1a", amount: "0.4382 BTC", date: "17.01.", phase: 2 },
  { from: "victim", to: "w1b", amount: "0.2110 BTC", date: "17.01.", phase: 2 },
  { from: "victim", to: "w1c", amount: "0.1874 BTC", date: "18.01.", phase: 2 },

  { from: "w1a", to: "mix", amount: "0.4200 BTC", date: "24.02.", phase: 3 },
  { from: "w1b", to: "mix", amount: "0.2100 BTC", date: "26.02.", phase: 3 },
  { from: "w1c", to: "mix2", amount: "0.1800 BTC", date: "01.03.", phase: 3 },
  { from: "w1b", to: "mix2", amount: "0.0090 BTC", date: "27.02.", phase: 3 },

  { from: "mix", to: "w2a", amount: "0.3100 BTC", date: "05.03.", phase: 4 },
  { from: "mix", to: "w2b", amount: "0.1900 BTC", date: "06.03.", phase: 4 },
  { from: "mix2", to: "w2b", amount: "0.0900 BTC", date: "07.03.", phase: 4 },
  { from: "mix2", to: "w2c", amount: "0.0980 BTC", date: "08.03.", phase: 4 },

  { from: "w2a", to: "ex", amount: "0.3100 BTC", date: "12.03.", phase: 5 },
  { from: "w2b", to: "ex", amount: "0.2800 BTC", date: "13.03.", phase: 5 },
  { from: "w2c", to: "ex", amount: "0.0980 BTC", date: "14.03.", phase: 5 },

  { from: "ex", to: "culprit", amount: "Auszahlung", date: "20.03.", phase: 6 },
];

const nodeById = (id: string) => NODES.find((n) => n.id === id)!;

function nodeFill(kind: NodeKind, active: boolean) {
  if (!active) return { fill: "hsl(220 15% 94%)", stroke: "hsl(220 12% 78%)", text: "hsl(220 10% 55%)" };
  switch (kind) {
    case "victim":
      return { fill: "hsl(0 84% 96%)", stroke: "hsl(0 74% 55%)", text: "hsl(0 65% 40%)" };
    case "wallet":
      return { fill: "hsl(210 100% 97%)", stroke: "hsl(221 83% 53%)", text: "hsl(221 60% 35%)" };
    case "mixer":
      return { fill: "hsl(280 60% 97%)", stroke: "hsl(280 55% 55%)", text: "hsl(280 45% 35%)" };
    case "exchange":
      return { fill: "hsl(210 100% 96%)", stroke: "hsl(221 83% 45%)", text: "hsl(221 70% 30%)" };
    case "culprit":
      return { fill: "hsl(142 71% 94%)", stroke: "hsl(142 71% 40%)", text: "hsl(142 60% 25%)" };
  }
}

function NodeIcon({ kind, active }: { kind: NodeKind; active: boolean }) {
  const color = nodeFill(kind, active).text;
  const size = 20;
  const props = { size, color, strokeWidth: 2 } as const;
  switch (kind) {
    case "victim": return <User {...props} />;
    case "wallet": return <Wallet {...props} />;
    case "mixer": return <Shuffle {...props} />;
    case "exchange": return <Building2 {...props} />;
    case "culprit": return <ShieldCheck {...props} />;
  }
}

export default function RecoveryVisualization({ onOpenGuide }: Props) {
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const [phase, setPhase] = useState(reducedMotion ? 6 : 1);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    timerRef.current = window.setInterval(() => {
      setPhase((p) => (p >= 6 ? 1 : p + 1));
    }, PHASE_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [reducedMotion]);

  const restart = () => {
    setPhase(1);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setPhase((p) => (p >= 6 ? 1 : p + 1));
    }, PHASE_MS);
  };

  const current = PHASES[phase - 1];

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-foreground mb-2">
          Nachverfolgung Ihrer Kryptowerte
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          So gehen wir vor: eine visuelle Darstellung des Weges Ihrer Coins –
          vom Vorfall bis zur Identifikation des Täters und der eingeleiteten Rückführung.
        </p>
      </div>

      {/* Visualization card */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-muted/30">
          <div className="text-sm">
            <span className="font-medium text-foreground">Phase {phase}/6 – {current.title}</span>
          </div>
          <Button variant="outline" size="sm" onClick={restart}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Neu starten
          </Button>
        </div>

        {/* SVG canvas */}
        <div className="overflow-x-hidden bg-[radial-gradient(circle_at_1px_1px,hsl(220_15%_88%)_1px,transparent_0)] [background-size:22px_22px]">
          <svg
            viewBox="0 0 920 440"
            className="w-full h-auto max-h-[340px] sm:max-h-[400px]"
            role="img"
            aria-label="Visualisierung der Krypto-Rückverfolgung"
          >
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="hsl(24 95% 55%)" />
              </marker>
              <marker id="arrowDim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="hsl(220 12% 75%)" />
              </marker>
            </defs>

            {/* Cluster halos (phase 4+) */}
            {phase >= 4 && (
              <>
                <rect x={180} y={80} width={400} height={280} rx={18}
                  fill="none" stroke="hsl(221 83% 53% / 0.35)" strokeDasharray="6 6" strokeWidth={1.5}
                  className="animate-in fade-in duration-500" />
                <text x={190} y={96} fontSize="10" fill="hsl(221 60% 40%)" fontWeight={600}>Cluster A – gleicher Akteur</text>
              </>
            )}

            {/* Edges */}
            {EDGES.map((e, i) => {
              const a = nodeById(e.from);
              const b = nodeById(e.to);
              const active = phase >= e.phase;
              const stroke = active ? "hsl(24 95% 55%)" : "hsl(220 12% 82%)";
              const drawing = phase === e.phase;
              return (
                <g key={i}>
                  <line
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={stroke}
                    strokeWidth={active ? 2.5 : 1.5}
                    markerEnd={active ? "url(#arrow)" : "url(#arrowDim)"}
                    style={
                      drawing
                        ? {
                            strokeDasharray: 600,
                            strokeDashoffset: 600,
                            animation: "recoveryDraw 900ms ease-out forwards",
                          }
                        : undefined
                    }
                    opacity={active ? 1 : 0.55}
                  />
                  {active && (
                    <g
                      className="animate-in fade-in duration-500"
                      transform={`translate(${(a.x + b.x) / 2}, ${(a.y + b.y) / 2 - 7})`}
                    >
                      <rect x={-34} y={-10} width={68} height={20} rx={4} fill="white" stroke="hsl(220 15% 88%)" />
                      <text x={0} y={-1} textAnchor="middle" fontSize="8.5" fill="hsl(220 15% 30%)" fontWeight={600}>
                        {e.amount}
                      </text>
                      <text x={0} y={8} textAnchor="middle" fontSize="7.5" fill="hsl(220 10% 50%)">
                        {e.date}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((n) => {
              const active = phase >= n.phase;
              const c = nodeFill(n.kind, active);
              const r = n.kind === "victim" || n.kind === "culprit" ? 30 : n.kind === "exchange" || n.kind === "mixer" ? 26 : 22;
              const pulsing = phase === n.phase;
              return (
                <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                  {pulsing && (
                    <circle r={r + 6} fill="none" stroke={c.stroke} strokeWidth={2}
                      style={{ animation: "recoveryPulse 1.6s ease-out infinite" }} opacity={0.6} />
                  )}
                  <circle r={r} fill={c.fill} stroke={c.stroke} strokeWidth={2} />
                  <foreignObject x={-10} y={-10} width={20} height={20}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <NodeIcon kind={n.kind} active={active} />
                    </div>
                  </foreignObject>
                  {n.label && (
                    <text x={0} y={r + 16} textAnchor="middle" fontSize="12" fontWeight={600} fill={active ? "hsl(220 15% 20%)" : "hsl(220 10% 55%)"}>
                      {n.label}
                    </text>
                  )}
                  {n.sub && (
                    <text x={0} y={r + (n.label ? 30 : 16)} textAnchor="middle" fontSize="10" fill={active ? "hsl(220 10% 45%)" : "hsl(220 10% 60%)"}>
                      {n.sub}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <style>{`
            @keyframes recoveryDraw { to { stroke-dashoffset: 0; } }
            @keyframes recoveryPulse {
              0% { transform: scale(1); opacity: 0.6; }
              100% { transform: scale(1.35); opacity: 0; }
            }
          `}</style>
        </div>

        {/* Current phase description */}
        <div className="px-4 sm:px-6 py-4 border-t border-border bg-background">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{current.title}. </span>
            <span className="text-muted-foreground">{current.text}</span>
          </p>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 px-4 sm:px-6 py-4 border-t border-border">
          {PHASES.map((p, i) => {
            const idx = i + 1;
            const active = phase === idx;
            const done = phase > idx;
            return (
              <div
                key={p.title}
                className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : done
                    ? "border-border bg-muted text-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                <div className="font-semibold">Phase {idx}</div>
                <div className="truncate">{p.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
        {[
          { kind: "victim" as const, label: "Opfer" },
          { kind: "wallet" as const, label: "Wallet" },
          { kind: "mixer" as const, label: "Mixer / Peel-Chain" },
          { kind: "exchange" as const, label: "Exchange (KYC)" },
          { kind: "culprit" as const, label: "Täter" },
        ].map((l) => {
          const c = nodeFill(l.kind, true);
          return (
            <div key={l.kind} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: c.fill, border: `2px solid ${c.stroke}` }} />
              {l.label}
            </div>
          );
        })}
      </div>

      {/* Info card */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-xl text-foreground mb-2">Wie wir Ihre Werte zurückholen</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Jede Transaktion auf der Blockchain ist dauerhaft nachvollziehbar. In enger Zusammenarbeit
          mit spezialisierten Blockchain-Analysten, Europol und internationalen Partnerbehörden
          verfolgen wir den Weg Ihrer Coins über Mixer, Peel-Chains und Wallet-Cluster bis zu
          einem regulierten Auszahlungspunkt. Sobald dieser identifiziert ist, erwirken wir über
          die zuständige Börse und Behörden die Offenlegung der Identität sowie die Sicherung und
          Rückführung Ihrer Werte.
        </p>
        {onOpenGuide && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onOpenGuide}>
            <BookOpen className="w-4 h-4 mr-1.5" />
            Anleitung öffnen
          </Button>
        )}
      </div>
    </main>
  );
}
