import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/** "Eigene Bank: …" truncated with ellipsis; full text in a tooltip on hover. */
export function TruncatedBank({ bank }: { bank?: string | null }) {
  if (!bank) return <span>Eigene Bank: —</span>;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block max-w-[220px] truncate align-bottom">Eigene Bank: {bank}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-normal break-words">Eigene Bank: {bank}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
