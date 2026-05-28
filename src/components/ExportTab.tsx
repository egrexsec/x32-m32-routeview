import { useMemo, useState } from "react";
import type { MixerScene } from "@/types/routing";
import { Button } from "@/components/ui/button";
import { combinedCSV, downloadText, sceneToMarkdown } from "@/lib/exporters";
import { Copy, Download, Printer, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export function ExportTab({ scene }: { scene: MixerScene }) {
  const md = useMemo(() => sceneToMarkdown(scene), [scene]);
  const [copied, setCopied] = useState(false);

  const base = (scene.fileName ?? "scene").replace(/\.[^.]+$/, "");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <ExportCard
          title="Markdown Cheatsheet"
          description="Professional, sectioned Markdown document with Inputs, Buses, DCAs and Outputs — ready for run-of-show docs and team handoffs."
          icon={FileText}
        >
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                downloadText(`${base}-routing.md`, md, "text/markdown");
                toast.success("Markdown downloaded");
              }}
            >
              <Download className="mr-1.5 h-4 w-4" /> Download .md
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(md);
                setCopied(true);
                toast.success("Markdown copied");
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Copy className="mr-1.5 h-4 w-4" /> {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </ExportCard>

        <ExportCard
          title="CSV Export"
          description="Single CSV containing all routing data — Inputs, Buses, DCAs and Outputs in clearly labelled sections. Opens in Excel, Google Sheets or Numbers."
          icon={FileSpreadsheet}
        >
          <Button
            size="sm"
            onClick={() => {
              downloadText(`${base}-routing.csv`, combinedCSV(scene), "text/csv");
              toast.success("CSV downloaded");
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> Download .csv
          </Button>
        </ExportCard>

        <ExportCard
          title="Print / Save as PDF"
          description="Open a professionally formatted single document containing Inputs, Buses, DCAs and Outputs. Use your browser's print dialog (Cmd/Ctrl + P) and choose 'Save as PDF'."
          icon={Printer}
        >
          <Button size="sm" variant="default" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Open Print View
          </Button>
        </ExportCard>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Markdown Preview
        </div>
        <pre className="max-h-[520px] overflow-auto p-4 font-mono text-xs leading-relaxed">{md}</pre>
      </div>
    </div>
  );
}

function ExportCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Download;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-primary/10 p-1.5 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

