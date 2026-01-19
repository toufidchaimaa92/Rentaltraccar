import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RentalStatusBadgeProps = {
  status?: string | null;
  label?: string;
  className?: string;
};

const rentalStatusStyles: Record<string, string> = {
  pending:
    "border-amber-200 bg-amber-100/80 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200",
  confirmed:
    "border-sky-200 bg-sky-100/80 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200",
  active:
    "border-emerald-200 bg-emerald-100/80 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  completed:
    "border-slate-200 bg-slate-100/80 text-slate-700 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200",
  cancelled:
    "border-red-200 bg-red-100/80 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
};

const fallbackStyle =
  "border-border bg-muted/60 text-muted-foreground dark:border-border dark:bg-muted/40";

export default function RentalStatusBadge({ status, label, className }: RentalStatusBadgeProps) {
  const normalizedStatus = (status ?? "").toLowerCase();
  const style = rentalStatusStyles[normalizedStatus] ?? fallbackStyle;
  const content = label ?? status ?? "—";

  return (
    <Badge className={cn("border text-xs font-semibold capitalize", style, className)}>
      {content}
    </Badge>
  );
}
