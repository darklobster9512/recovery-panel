import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogShellHeaderProps {
  icon: ReactNode;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  tone?: "primary" | "danger";
}

export function DialogShellHeader({
  icon,
  eyebrow,
  title,
  description,
  right,
  tone = "primary",
}: DialogShellHeaderProps) {
  const badgeClass =
    tone === "danger"
      ? "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
      : "text-primary-foreground shadow-elegant";
  const badgeStyle =
    tone === "primary" ? { background: "var(--gradient-primary)" } : undefined;

  return (
    <div className="-mx-6 -mt-6 px-6 pt-6 pb-5 border-b border-border/60 bg-[hsl(221_45%_98%)] rounded-t-lg">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            badgeClass,
          )}
          style={badgeStyle}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h2 className="text-lg font-semibold tracking-tight text-foreground leading-tight mt-0.5 truncate">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 leading-snug">
              {description}
            </p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
}

interface SectionProps {
  label?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DialogSection({ label, hint, children, className }: SectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {(label || hint) && (
        <div className="flex items-baseline justify-between gap-2">
          {label && (
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </h3>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function DialogFooterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-6 -mb-6 mt-2 px-6 py-4 border-t border-border/60 bg-muted/30 rounded-b-lg flex items-center justify-end gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
