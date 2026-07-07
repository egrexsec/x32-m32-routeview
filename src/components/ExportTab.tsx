import { useMemo, useState } from "react";
import type { MixerScene } from "@/types/routing";
import { Button } from "@/components/ui/button";
import {
  combinedCSV,
  defaultExportOptions,
  downloadText,
  exportBaseName,
  parserBucketGroupLabels,
  sceneToHtml,
  sceneToJson,
  sceneToMarkdown,
  sceneToPlainText,
  type ExportOptions,
  type ParserBucketGroup,
} from "@/lib/exporters";
import { Braces, Code2, Copy, Download, FileSpreadsheet, FileText, Printer, Settings2 } from "lucide-react";
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
  const base = exportBaseName(scene);

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

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(md);
    setCopied(true);
    toast.success("Volunteer guide copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="export-workspace">
      <section className="primary-export-card">
        <div>
          <p className="prod-kicker">Export Documentation</p>
          <h2>Volunteer guide is ready</h2>
          <p>
            Markdown is the best default for church teams because it works in Planning Center notes, shared drives,
            GitHub, email, and most documentation tools.
          </p>
        </div>
        <div className="primary-export-actions">
          <Button
            size="lg"
            onClick={() => {
              downloadText(`${base}-volunteer-guide.md`, md, "text/markdown");
              toast.success("Volunteer guide downloaded");
            }}
          >
            <Download className="mr-1.5 h-4 w-4" /> Export Volunteer Guide
          </Button>
          <Button size="lg" variant="secondary" onClick={copyMarkdown}>
            <Copy className="mr-1.5 h-4 w-4" /> {copied ? "Copied" : "Copy Markdown"}
          </Button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <details className="panel p-4" open>
            <summary className="cursor-pointer text-sm font-semibold">More Export Options</summary>
            <div className="mt-4 grid gap-3">
              <ExportButton
                title="HTML"
                description="Standalone printable page for teams that want a single file."
                icon={Code2}
                onClick={() => {
                  downloadText(`${base}-volunteer-guide.html`, html, "text/html");
                  toast.success("HTML downloaded");
                }}
              />
              <ExportButton
                title="Plain Text"
                description="Simple text for email, service notes, or older systems."
                icon={FileText}
                onClick={() => {
                  downloadText(`${base}-volunteer-guide.txt`, plainText, "text/plain");
                  toast.success("Plain text downloaded");
                }}
              />
              <ExportButton
                title="CSV"
                description="Spreadsheet-friendly routing data with selected advanced sections."
                icon={FileSpreadsheet}
                onClick={() => {
                  downloadText(`${base}-routing.csv`, combinedCSV(scene, exportOptions), "text/csv");
                  toast.success("CSV downloaded");
                }}
              />
              <ExportButton
                title="JSON"
                description="Structured archive for automation or future RouteView import work."
                icon={Braces}
                onClick={() => {
                  downloadText(`${base}-routing.json`, json, "application/json");
                  toast.success("JSON downloaded");
                }}
              />
              <ExportButton
                title="Print / Save as PDF"
                description="Open the browser print dialog and choose Save as PDF."
                icon={Printer}
                onClick={() => window.print()}
              />
            </div>
          </details>

          <details className="panel p-4">
            <summary className="cursor-pointer text-sm font-semibold">Advanced Console Details</summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <CheckRow label="Console Settings" checked={!!exportOptions.includeSettings} onChange={(checked) => updateOption("includeSettings", checked)} />
                <CheckRow label="Channel Processing" checked={!!exportOptions.includeChannelProcessing} onChange={(checked) => updateOption("includeChannelProcessing", checked)} />
                <CheckRow label="Channel Sends" checked={!!exportOptions.includeChannelSends} onChange={(checked) => updateOption("includeChannelSends", checked)} />
                <CheckRow label="Parser Bucket Summary" checked={!!exportOptions.includeUnrecognizedSummary} onChange={(checked) => updateOption("includeUnrecognizedSummary", checked)} />
                <CheckRow label="Parser Bucket Examples" checked={!!exportOptions.includeUnrecognizedExamples} onChange={(checked) => updateOption("includeUnrecognizedExamples", checked)} />
                <CheckRow label="Raw Debug Lines" checked={!!exportOptions.includeRawUnrecognized} onChange={(checked) => updateOption("includeRawUnrecognized", checked)} />
              </div>

              <div className="border-t pt-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Settings2 className="h-3.5 w-3.5" /> Parser Bucket Tabs to Include
                </div>
                <div className="grid gap-2">
                  {parserBucketGroupLabels.map((bucket) => (
                    <CheckRow key={bucket} label={bucket} checked={selectedBuckets.has(bucket)} onChange={() => toggleBucketGroup(bucket)} />
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Markdown Preview
          </div>
          <pre className="max-h-[620px] overflow-auto p-4 font-mono text-xs leading-relaxed">{md}</pre>
        </div>
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

function ExportButton({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: typeof Download;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="export-option-button">
      <span className="rounded-md bg-primary/10 p-1.5 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <Download className="ml-auto h-4 w-4 text-muted-foreground" />
    </button>
  );
}

