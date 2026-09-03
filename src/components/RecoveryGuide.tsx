import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import appStoreBadge from "@/assets/app-store.svg";
import googlePlayBadge from "@/assets/google-play.svg";

const TRUST_WALLET_APPSTORE =
  "https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409";
const TRUST_WALLET_PLAYSTORE =
  "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp";

const STEPS = [
  {
    title: "Neue Trust Wallet erstellen",
    text: "Laden Sie die offizielle Trust Wallet-App aus dem App Store bzw. Google Play Store herunter und erstellen Sie eine neue Wallet.",
  },
  {
    title: "Empfangsadresse übermitteln",
    text: "Senden Sie Ihre Empfangsadresse für die BNB Smart Chain (BSC) an den zuständigen Ansprechpartner.",
  },
  {
    title: "Übertragung der Kryptowährungen",
    text: "Nach Bestätigung der Empfangsadresse werden die entsprechenden Coins auf Ihre Trust Wallet übertragen.",
  },
];

interface Props {
  onBack: () => void;
}

export default function RecoveryGuide({ onBack }: Props) {
  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Zurück
      </Button>

      <div className="rounded-2xl overflow-hidden border border-border bg-white shadow-sm">
        {/* Header (Navy) */}
        <div className="relative bg-[#0b1f3a] px-6 sm:px-12 pt-10 pb-8 text-center">
          <p className="font-serif text-4xl sm:text-5xl tracking-wide text-white">
            Korte <span className="text-white/50">&amp;</span>{" "}
            <span className="text-white/80">Partner</span>
          </p>
          <div className="mx-auto mt-6 h-px w-full bg-gradient-to-r from-transparent via-[#c9a24a]/70 to-transparent" />
        </div>

        {/* Body */}
        <div className="px-6 sm:px-12 py-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left: Steps */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0b1f3a] leading-tight">
                Anleitung zu Rückführungen
                <br />
                verlorener Kryptowährungen
              </h1>
              <div className="mt-4 h-px w-full bg-[#c9a24a]/60" />
              <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-[#c9a24a]">
                SCHRITT-FÜR-SCHRITT
              </p>
            </div>

            <ol className="space-y-6">
              {STEPS.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0b1f3a] text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-[#0b1f3a]">{step.title}</p>
                    <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Trust Wallet download buttons */}
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#c9a24a] mb-3">
                TRUST WALLET HERUNTERLADEN
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={TRUST_WALLET_APPSTORE}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={appStoreBadge}
                    alt="Im App Store laden"
                    className="h-11 w-auto transition-transform duration-200 hover:scale-105"
                  />
                </a>
                <a
                  href={TRUST_WALLET_PLAYSTORE}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={googlePlayBadge}
                    alt="Bei Google Play laden"
                    className="h-11 w-auto transition-transform duration-200 hover:scale-105"
                  />
                </a>
              </div>
            </div>

            {/* Security notice */}
            <div className="rounded-lg border-l-4 border-[#0b1f3a] bg-slate-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#0b1f3a] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#0b1f3a]">
                    Wichtiger Sicherheitshinweis
                  </p>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                    Geben Sie niemals Ihre Seed Phrase, Ihren privaten Schlüssel
                    oder Ihr Wallet-Passwort an Dritte weiter. Für eine normale
                    Übertragung von Kryptowährungen wird lediglich die
                    öffentliche Empfangsadresse benötigt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact */}
          <aside className="md:border-l md:border-slate-200 md:pl-8 space-y-5 text-sm">
            <ContactRow label="Telefon" value="040 573086460" />
            <ContactRow label="E-Mail" value="info@korte-kanzlei.de" />
            <ContactRow label="Internet" value="Korte-Kanzlei.de" />
            <div>
              <p className="font-semibold text-[#0b1f3a]">Adresse</p>
              <p className="mt-1 text-slate-700">
                Domstraße 15
                <br />
                20095 Hamburg
              </p>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="bg-[#0b1f3a] text-white/85 px-6 sm:px-12 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <p className="font-semibold text-white mb-1">Geschäftsführung</p>
            <p>Dr. Thomas Korte</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">Registereintrag</p>
            <p>
              Registergericht: Amtsgericht Hamburg
              <br />
              Registernummer: PR 317
            </p>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">
              Umsatzsteuer-Identifikationsnummer
            </p>
            <p>USt-IdNr.: DE317391938</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-[#0b1f3a]">{label}</p>
      <p className="mt-1 text-slate-700 break-words">{value}</p>
    </div>
  );
}
