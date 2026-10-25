import { cn } from "@/lib/utils";

export default function InitialsAvatar({ name, className }: { name?: string | null; className?: string }) {
  const ini = (name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
  return (
    <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary", className)}>
      {ini}
    </span>
  );
}
