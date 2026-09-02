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
  const badgeClass = tone === "danger" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground";
  const badgeStyle = undefined;


  return (
    <div className="-mx-6 -mt-6 border-b border-border bg-card px-6 pb-5 pt-6 rounded-t-lg">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md shadow-sm",
            badgeClass,
          )}
          style={badgeStyle}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[10px] font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-lg font-semibold text-foreground leading-tight mt-0.5 truncate">
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
            <h3 className="text-[11px] font-bold uppercase text-muted-foreground" style={{ letterSpacing: "0.06em" }}>
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
        "-mx-6 -mb-6 mt-2 px-6 py-4 border-t border-border bg-muted/45 rounded-b-lg flex items-center justify-end gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
