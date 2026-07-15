import { useMemo, useState, type ReactNode } from "react";
import type { MixerScene } from "@/types/routing";
import { Button } from "@/components/ui/button";
import {
  defaultExportOptions,
  downloadText,
  exportBaseName,
  parserBucketGroupLabels,
  sceneToHtml,
  sceneToJson,
  sceneToMarkdown,
  type ExportOptions,
  type ParserBucketGroup,
} from "@/lib/exporters";
import { Braces, Code2, Copy, Download, FileText, Printer, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { printThemeLabels, type PrintOptions } from "@/lib/printOptions";

export function ExportTab({
  scene,
  printOptions,
  onPrintOptionsChange,
}: {
  scene: MixerScene;
  printOptions: PrintOptions;
  onPrintOptionsChange: (options: PrintOptions) => void;
}) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    ...defaultExportOptions,
    parserBucketGroups: [...parserBucketGroupLabels],
  });
  const [copied, setCopied] = useState(false);

  const md = useMemo(() => sceneToMarkdown(scene, exportOptions), [scene, exportOptions]);
  const html = useMemo(() => sceneToHtml(scene, exportOptions), [scene, exportOptions]);
  const json = useMemo(() => sceneToJson(scene), [scene]);
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
  const updatePrintOption = <K extends keyof PrintOptions>(key: K, value: PrintOptions[K]) => {
    onPrintOptionsChange({ ...printOptions, [key]: value });
  };

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
          <p className="prod-kicker">Next: Export and Share</p>
          <h2>Export PDF</h2>
          <p>
            Use the print-ready PDF as the default handoff for volunteers, worship leaders, and technical directors.
          </p>
        </div>
        <div className="primary-export-actions">
          <Button
            size="lg"
            onClick={() => {
              window.print();
            }}
          >
            <Printer className="mr-1.5 h-4 w-4" /> Print / Save as PDF
          </Button>
          <Button size="lg" variant="secondary" onClick={copyMarkdown}>
            <Copy className="mr-1.5 h-4 w-4" /> {copied ? "Copied" : "Copy Markdown"}
          </Button>
        </div>
      </section>

      <section className="panel export-designer" aria-labelledby="export-designer-title">
        <div className="export-designer-heading">
          <div>
            <p className="prod-kicker">PDF Designer</p>
            <h2 id="export-designer-title">Customize the handoff</h2>
            <p>Choose the audience, visual system, page format, and document metadata before printing.</p>
          </div>
          <div className="theme-swatches" aria-label="Selected print palette">
            <span style={{ backgroundColor: printOptions.accentColor }} />
            <span />
            <span />
          </div>
        </div>

        <div className="export-control-grid">
          <SelectField label="Document profile" value={printOptions.profile} onChange={(value) => updatePrintOption("profile", value as PrintOptions["profile"])}>
            <option value="volunteer">Volunteer Guide</option>
            <option value="technical">Technical Report</option>
          </SelectField>
          <SelectField label="Design theme" value={printOptions.theme} onChange={(value) => updatePrintOption("theme", value as PrintOptions["theme"])}>
            {Object.entries(printThemeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
          <SelectField label="Text density" value={printOptions.density} onChange={(value) => updatePrintOption("density", value as PrintOptions["density"])}>
            <option value="compact">Compact</option>
            <option value="standard">Standard</option>
            <option value="large">Large text</option>
          </SelectField>
          <SelectField label="Paper size" value={printOptions.paper} onChange={(value) => updatePrintOption("paper", value as PrintOptions["paper"])}>
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </SelectField>
          <TextField label="Document title" value={printOptions.documentTitle} onChange={(value) => updatePrintOption("documentTitle", value)} />
          <TextField label="Venue / church" value={printOptions.venueName} placeholder="Optional" onChange={(value) => updatePrintOption("venueName", value)} />
          <TextField label="Prepared by" value={printOptions.preparedBy} placeholder="Optional" onChange={(value) => updatePrintOption("preparedBy", value)} />
          <TextField label="Revision" value={printOptions.revision} onChange={(value) => updatePrintOption("revision", value)} />
          <label className="export-field">
            <span>Accent color</span>
            <div className="color-field">
              <input type="color" value={printOptions.accentColor} onChange={(event) => updatePrintOption("accentColor", event.target.value)} />
              <code>{printOptions.accentColor.toUpperCase()}</code>
            </div>
          </label>
        </div>

        <div className="export-check-grid">
          <CheckRow label="Include cover page" checked={printOptions.includeCover} onChange={(checked) => updatePrintOption("includeCover", checked)} />
          <CheckRow label="Include troubleshooting" checked={printOptions.includeTroubleshooting} onChange={(checked) => updatePrintOption("includeTroubleshooting", checked)} />
          <CheckRow label="Include advanced details" checked={printOptions.includeAdvanced} onChange={(checked) => updatePrintOption("includeAdvanced", checked)} />
          <CheckRow label="Show unassigned controls" checked={printOptions.showUnassigned} onChange={(checked) => updatePrintOption("showUnassigned", checked)} />
          <CheckRow label="Mark internal / confidential" checked={printOptions.confidential} onChange={(checked) => updatePrintOption("confidential", checked)} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <details className="panel p-4">
            <summary className="cursor-pointer text-sm font-semibold">More export options</summary>
            <div className="mt-4 grid gap-3">
              <ExportButton
                title="Markdown"
                description="Useful for shared drives, GitHub, and editable team documentation."
                icon={FileText}
                onClick={() => {
                  downloadText(`${base}-volunteer-guide.md`, md, "text/markdown");
                  toast.success("Markdown downloaded");
                }}
              />
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
                title="JSON Advanced Export"
                description="Structured scene archive for technical directors and advanced users."
                icon={Braces}
                onClick={() => {
                  downloadText(`${base}-routing.json`, json, "application/json");
                  toast.success("JSON downloaded");
                }}
              />
              <ExportButton
                title="Print / Save as PDF"
                description="Default professional handoff with the condensed chart and volunteer guide."
                icon={Printer}
                onClick={() => window.print()}
              />
            </div>
          </details>

          <details className="panel p-4">
            <summary className="cursor-pointer text-sm font-semibold">Advanced Console Details</summary>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                This section is mainly for technical directors and advanced users. It controls whether exported Markdown includes items RouteView could not fully explain, raw routing details, channel processing, and channel sends.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <CheckRow label="Console Settings" checked={!!exportOptions.includeSettings} onChange={(checked) => updateOption("includeSettings", checked)} />
                <CheckRow label="Channel Processing" checked={!!exportOptions.includeChannelProcessing} onChange={(checked) => updateOption("includeChannelProcessing", checked)} />
                <CheckRow label="Channel Sends" checked={!!exportOptions.includeChannelSends} onChange={(checked) => updateOption("includeChannelSends", checked)} />
                <CheckRow label="Items RouteView Could Not Fully Explain" checked={!!exportOptions.includeUnrecognizedSummary} onChange={(checked) => updateOption("includeUnrecognizedSummary", checked)} />
                <CheckRow label="Examples RouteView Could Not Fully Explain" checked={!!exportOptions.includeUnrecognizedExamples} onChange={(checked) => updateOption("includeUnrecognizedExamples", checked)} />
                <CheckRow label="Raw Routing Details" checked={!!exportOptions.includeRawUnrecognized} onChange={(checked) => updateOption("includeRawUnrecognized", checked)} />
              </div>

              <div className="border-t pt-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Settings2 className="h-3.5 w-3.5" /> Advanced areas to include
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

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="export-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </label>
  );
}

function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <label className="export-field">
      <span>{label}</span>
      <input type="text" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
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
