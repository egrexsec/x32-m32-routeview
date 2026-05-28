import { cn } from "@/lib/utils";
import type { ParseStatus } from "@/types/routing";
import { AlertTriangle, CheckCircle2, CircleAlert, HelpCircle } from "lucide-react";

const map: Record<ParseStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  Parsed: { label: "Parsed", cls: "bg-success/15 text-success border-success/30", Icon: CheckCircle2 },
  Partial: { label: "Partial", cls: "bg-warning/15 text-warning-foreground border-warning/40", Icon: AlertTriangle },
  "Missing Data": {
    label: "Missing Data",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
    Icon: CircleAlert,
  },
  Unsupported: {
    label: "Unsupported",
    cls: "bg-muted text-muted-foreground border-border",
    Icon: HelpCircle,
  },
};

export function StatusBadge({ status, className }: { status: ParseStatus; className?: string }) {
  const { label, cls, Icon } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cls,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
