import { useMemo, useState } from "react";
import type { MixerScene } from "@/types/routing";
import { Button } from "@/components/ui/button";
import {
  combinedCSV,
  defaultExportOptions,
  downloadText,
  parserBucketGroupLabels,
  sceneToHtml,
  sceneToJson,
  sceneToMarkdown,
  sceneToPlainText,
  type ExportOptions,
  type ParserBucketGroup,
} from "@/lib/exporters";
import { Copy, Download, Printer, FileText, FileSpreadsheet, Settings2, Braces, Code2 } from "lucide-react";
import { toast } from "sonner";

export function ExportTab({ scene }: { scene: MixerScene }) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    ...defaultExportOptions,
    parserBucketGroups: [...parserBucketGroupLabels],
  });
  const [copied, setCopied] = useState(false);

  const md = useMemo(() => sceneToMarkdown(scene, exportOptions), [scene, exportOptions]);
  const html = useMemo(() => sceneToHtml(scene, exportOptions), [scene, exportOptions]);
  const json = useMemo(() => sceneToJson(scene), [scene]);
  const plainText = useMemo(() => sceneToPlainText(scene, exportOptions), [scene, exportOptions]);
  const base = (scene.fileName ?? "scene").replace(/\.[^.]+$/, "");

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setExportOptions((current) => ({ ...current, [key]: value }));
  };

  const toggleBucketGroup = (bucket: ParserBucketGroup) => {
    setExportOptions((current) => {
      const selected = new Set(current.parserBucketGroups ?? []);
      if (selected.has(bucket)) selected.delete(bucket);
      else selected.add(bucket);
      return { ...current, parserBucketGroups: Array.from(selected) };
    });
  };

  const selectedBuckets = new Set(exportOptions.parserBucketGroups ?? []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <ExportCard
          title="Markdown"
          description="Sectioned documentation for run-of-show docs, volunteer handoffs, and repo-friendly notes."
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
          title="HTML"
          description="Standalone, printable HTML that preserves tables and scene structure."
          icon={Code2}
        >
          <Button
            size="sm"
            onClick={() => {
              downloadText(`${base}-routing.html`, html, "text/html");
              toast.success("HTML downloaded");
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> Download .html
          </Button>
        </ExportCard>

        <ExportCard
          title="JSON"
          description="Structured export for archiving, automation, and future RouteView imports."
          icon={Braces}
        >
          <Button
            size="sm"
            onClick={() => {
              downloadText(`${base}-routing.json`, json, "application/json");
              toast.success("JSON downloaded");
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> Download .json
          </Button>
        </ExportCard>

        <ExportCard
          title="Plain Text"
          description="Readable text for email, service notes, and systems that do not handle Markdown."
          icon={FileText}
        >
          <Button
            size="sm"
            onClick={() => {
              downloadText(`${base}-routing.txt`, plainText, "text/plain");
              toast.success("Plain text downloaded");
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> Download .txt
          </Button>
        </ExportCard>

        <ExportCard
          title="CSV"
          description="Single CSV containing routing data plus selected Parser Bucket sections. Opens in Excel, Google Sheets, or Numbers."
          icon={FileSpreadsheet}
        >
          <Button
            size="sm"
            onClick={() => {
              downloadText(`${base}-routing.csv`, combinedCSV(scene, exportOptions), "text/csv");
              toast.success("CSV downloaded");
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> Download .csv
          </Button>
        </ExportCard>

        <ExportCard
          title="Print / Save as PDF"
          description="Open a professionally formatted document. Use your browser's print dialog and choose 'Save as PDF'."
          icon={Printer}
        >
          <Button size="sm" variant="default" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Open Print View
          </Button>
        </ExportCard>

        <ExportCard
          title="Parser Bucket Export Selectors"
          description="Optionally include Parser Bucket summaries or examples in Markdown and CSV exports. Core routing exports still work like before."
          icon={Settings2}
        >
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckRow
                label="Parser Bucket Summary"
                checked={!!exportOptions.includeUnrecognizedSummary}
                onChange={(checked) => updateOption("includeUnrecognizedSummary", checked)}
              />
              <CheckRow
                label="Parser Bucket Examples"
                checked={!!exportOptions.includeUnrecognizedExamples}
                onChange={(checked) => updateOption("includeUnrecognizedExamples", checked)}
              />
              <CheckRow
                label="Raw Debug Lines"
                checked={!!exportOptions.includeRawUnrecognized}
                onChange={(checked) => updateOption("includeRawUnrecognized", checked)}
              />
            </div>

            <div className="border-t pt-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Parser Bucket Tabs to Include
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
