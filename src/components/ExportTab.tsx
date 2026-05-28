import { useMemo, useState } from "react";
import type { MixerScene } from "@/types/routing";
import { Button } from "@/components/ui/button";
import {
  combinedCSV,
  downloadText,
  parserBucketGroupLabels,
  sceneToMarkdown,
  type ExportOptions,
  type ParserBucketGroup,
} from "@/lib/exporters";
import { Copy, Download, Printer, FileText, FileSpreadsheet, Settings2 } from "lucide-react";
import { toast } from "sonner";

export function ExportTab({
  scene,
  options,
  onOptionsChange,
}: {
  scene: MixerScene;
  options: ExportOptions;
  onOptionsChange: (options: ExportOptions) => void;
}) {
  const md = useMemo(() => sceneToMarkdown(scene, options), [scene, options]);
  const [copied, setCopied] = useState(false);

  const base = (scene.fileName ?? "scene").replace(/\.[^.]+$/, "");

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const toggleBucketGroup = (bucket: ParserBucketGroup) => {
    const current = new Set(options.parserBucketGroups ?? []);
    if (current.has(bucket)) current.delete(bucket);
    else current.add(bucket);
    updateOption("parserBucketGroups", Array.from(current));
  };

  const selectedBuckets = new Set(options.parserBucketGroups ?? []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <ExportCard
          title="Export Options"
          description="Choose which advanced sections and parser bucket groups are included in Markdown, CSV, and browser print/PDF output."
          icon={Settings2}
        >
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckRow
                label="Console Settings"
                checked={!!options.includeSettings}
                onChange={(checked) => updateOption("includeSettings", checked)}
              />
              <CheckRow
                label="Channel Processing"
                checked={!!options.includeChannelProcessing}
                onChange={(checked) => updateOption("includeChannelProcessing", checked)}
              />
              <CheckRow
                label="Channel Sends"
                checked={!!options.includeChannelSends}
                onChange={(checked) => updateOption("includeChannelSends", checked)}
              />
              <CheckRow
                label="Parser Bucket Summary"
                checked={!!options.includeUnrecognizedSummary}
                onChange={(checked) => updateOption("includeUnrecognizedSummary", checked)}
              />
              <CheckRow
                label="Parser Bucket Examples"
                checked={!!options.includeUnrecognizedExamples}
                onChange={(checked) => updateOption("includeUnrecognizedExamples", checked)}
              />
              <CheckRow
                label="Raw Debug Lines"
                checked={!!options.includeRawUnrecognized}
                onChange={(checked) => updateOption("includeRawUnrecognized", checked)}
              />
            </div>

            <div className="border-t pt-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Parser Bucket Groups
              </div>
              <div className="grid gap-2">
                {parserBucketGroupLabels.map((bucket) => (
                  <CheckRow
                    key={bucket}
                    label={bucket}
                    checked={selectedBuckets.has(bucket)}
                    onChange={() => toggleBucketGroup(bucket)}
                  />
                ))}
              </div>
            </div>
          </div>
        </ExportCard>

        <ExportCard
          title="Markdown Cheatsheet"
          description="Professional, sectioned Markdown document using the selected export options."
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
          description="Single CSV using the selected export options. Opens in Excel, Google Sheets or Numbers."
          icon={FileSpreadsheet}
        >
          <Button
            size="sm"
            onClick={() => {
              downloadText(`${base}-routing.csv`, combinedCSV(scene, options), "text/csv");
              toast.success("CSV downloaded");
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> Download .csv
          </Button>
        </ExportCard>

        <ExportCard
          title="Print / Save as PDF"
          description="Print view uses the same selected export options. Use your browser print dialog and choose Save as PDF."
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
        <pre className="max-h-[640px] overflow-auto p-4 font-mono text-xs leading-relaxed">{md}</pre>
      </div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      <span>{label}</span>
    </label>
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
