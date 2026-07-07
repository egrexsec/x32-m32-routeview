import type { MixerScene, UnrecognizedCategory } from "@/types/routing";

export type ParserBucketGroup =
  | "Input Channel Processing"
  | "Mix/Output Processing"
  | "Routing & Distribution"
  | "Effects & External Processing"
  | "Console/System Management";

export const parserBucketGroups: Record<ParserBucketGroup, string[]> = {
  "Input Channel Processing": [
    "Channel Delay",
    "Channel Preamp",
    "Channel Gate",
    "Channel Dynamics",
    "Channel Insert",
    "Channel EQ",
    "Channel Sends",
    "Channel Automix",
  ],
  "Mix/Output Processing": ["Bus Processing", "Matrix Processing", "Main/Mono Processing", "Output Detail Settings"],
  "Routing & Distribution": ["User Routing", "Headamp", "DP48", "Talkback"],
  "Effects & External Processing": ["Effects Rack"],
  "Console/System Management": ["Console Config", "User Controls", "Scene Metadata", "Miscellaneous"],
};

export const parserBucketGroupLabels = Object.keys(parserBucketGroups) as ParserBucketGroup[];

export interface ExportOptions {
  includeSettings?: boolean;
  includeChannelProcessing?: boolean;
  includeChannelSends?: boolean;
  includeUnrecognizedSummary?: boolean;
  includeUnrecognizedExamples?: boolean;
  includeRawUnrecognized?: boolean;
  parserBucketGroups?: ParserBucketGroup[];
}

export const defaultExportOptions: ExportOptions = {
  includeSettings: false,
  includeChannelProcessing: false,
  includeChannelSends: false,
  includeUnrecognizedSummary: true,
  includeUnrecognizedExamples: false,
  includeRawUnrecognized: false,
  parserBucketGroups: [...parserBucketGroupLabels],
};

export function exportBaseName(scene: MixerScene): string {
  const sourceName = (scene.fileName ?? "scene").replace(/\.[^.]+$/, "");
  const cleanName = sourceName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const date = new Date(scene.parsedAt).toISOString().slice(0, 10);
  return `${cleanName || "scene"}-${date}`;
}

function pad(s: string | number, n: number): string {
  const str = String(s);
  return str.length >= n ? str : str + " ".repeat(n - str.length);
}

function mdCell(value: string | number | undefined): string {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function mdTable(headers: string[], rows: (string | number | undefined)[][]): string {
  const aligns = headers.map(() => "---");
  const out: string[] = [];
  out.push(`| ${headers.map(mdCell).join(" | ")} |`);
  out.push(`| ${aligns.join(" | ")} |`);
  for (const r of rows) out.push(`| ${r.map(mdCell).join(" | ")} |`);
  return out.join("\n");
}

function resolvedOptions(options?: ExportOptions): Required<ExportOptions> {
  return {
    ...defaultExportOptions,
    ...options,
    parserBucketGroups: options?.parserBucketGroups ?? defaultExportOptions.parserBucketGroups ?? [],
  } as Required<ExportOptions>;
}

export function bucketGroupForCategory(category: string): ParserBucketGroup {
  const found = parserBucketGroupLabels.find((group) => parserBucketGroups[group].includes(category));
  return found ?? "Console/System Management";
}

export function groupedParserCategories(scene: MixerScene, selectedGroups?: ParserBucketGroup[]) {
  const selected = new Set(selectedGroups ?? parserBucketGroupLabels);
  return parserBucketGroupLabels
    .map((bucket) => ({
      bucket,
      categories: (scene.unrecognizedCategories ?? []).filter(
        (category) => selected.has(bucket) && bucketGroupForCategory(category.category) === bucket,
      ),
    }))
    .filter((group) => group.categories.length > 0);
}

function filteredParserCategories(scene: MixerScene, selectedGroups?: ParserBucketGroup[]): UnrecognizedCategory[] {
  const selected = new Set(selectedGroups ?? parserBucketGroupLabels);
  return (scene.unrecognizedCategories ?? []).filter((category) => selected.has(bucketGroupForCategory(category.category)));
}

function hasChannelProcessing(scene: MixerScene): boolean {
  return scene.inputs.some((c) => c.processing && Object.keys(c.processing).length > 0);
}

function hasChannelSends(scene: MixerScene): boolean {
  return scene.inputs.some((c) => (c.sends ?? []).length > 0);
}

function processingSummary(scene: MixerScene): (string | number | undefined)[][] {
  return scene.inputs
    .filter((c) => c.processing && Object.keys(c.processing).length > 0)
    .map((c) => [
      c.number,
      c.name,
      c.processing?.delay ?? "",
      c.processing?.preamp ?? "",
      c.processing?.gate ?? "",
      c.processing?.dynamics ?? "",
      c.processing?.eq ?? "",
      c.processing?.mainMix ?? "",
      c.processing?.automix ?? "",
    ]);
}

function sendsSummary(scene: MixerScene): (string | number | undefined)[][] {
  return scene.inputs.flatMap((c) =>
    (c.sends ?? []).map((send) => [
      c.number,
      c.name,
      send.bus,
      send.enabled ? "ON" : "OFF",
      send.level,
      send.pan ?? "",
      send.tap ?? "",
    ]),
  );
}

export function sceneToMarkdown(scene: MixerScene, options?: ExportOptions): string {
  const opts = resolvedOptions(options);
  const parserGroups = groupedParserCategories(scene, opts.parserBucketGroups);
  const parserCategories = filteredParserCategories(scene, opts.parserBucketGroups);
  const lines: string[] = [];

  lines.push(`# X32 / M32 RouteView — Routing Documentation`);
  lines.push("");
  lines.push(`> Professional scene routing summary generated by RouteView.`);
  lines.push("");
  lines.push(`## Scene Overview`);
  lines.push("");
  lines.push(`| Field | Value |`);
  lines.push(`| --- | --- |`);
  if (scene.fileName) lines.push(`| Source file | \`${scene.fileName}\` |`);
  lines.push(`| Mixer | ${scene.mixerType} |`);
  lines.push(`| Parse status | ${scene.status} |`);
  lines.push(`| Inputs | ${scene.inputs.length} |`);
  lines.push(`| Mix buses | ${scene.buses.length} |`);
  lines.push(`| DCA groups | ${scene.dcas.length} |`);
  lines.push(`| Output patches | ${scene.outputs.length} |`);
  lines.push(`| Settings captured | ${scene.settings?.length ?? 0} |`);
  lines.push(`| Parser categories | ${scene.unrecognizedCategories?.length ?? 0} |`);
  lines.push(`| Generated | ${new Date(scene.parsedAt).toLocaleString()} |`);
  lines.push("");

  lines.push(`---`, "", `## 1. Input Channels`, "");
  lines.push(
    mdTable(
      ["Ch", "Name", "Source", "DCA", "Color", "Notes"],
      scene.inputs.map((c) => [
        c.number,
        c.name,
        c.source ?? "",
        (c.dcaAssignments ?? []).join(", "),
        c.color ?? "",
        c.notes ?? "",
      ]),
    ),
  );
  lines.push("");

  lines.push(`---`, "", `## 2. Mix Buses`, "");
  lines.push(mdTable(["Bus", "Name", "Type", "Notes"], scene.buses.map((b) => [b.number, b.name, b.type ?? "", b.notes ?? ""])));
  lines.push("");

  lines.push(`---`, "", `## 3. DCA Groups`, "");
  lines.push(mdTable(["DCA", "Name", "Assigned Channels"], scene.dcas.map((d) => [d.number, d.name, (d.assignedChannels ?? []).join(", ")])));
  lines.push("");

  lines.push(`---`, "", `## 4. Output Patches`, "");
  lines.push(mdTable(["Type", "#", "Source", "Notes"], scene.outputs.map((o) => [o.outputType, o.number, o.source, o.notes ?? ""])));
  lines.push("");

  if (scene.routingBlocks.length) {
    lines.push(`---`, "", `## 5. Routing Blocks`, "");
    for (const r of scene.routingBlocks) lines.push(`- **${r.blockName}** — ${r.assignments.join(", ")}`);
    lines.push("");
  }

  if (opts.includeSettings && (scene.settings?.length ?? 0) > 0) {
    lines.push(`---`, "", `## Console Settings`, "");
    lines.push(mdTable(["Section", "Setting", "Value", "Notes"], (scene.settings ?? []).map((s) => [s.section, s.name, s.value, s.notes ?? ""])));
    lines.push("");
  }

  if (opts.includeChannelProcessing && hasChannelProcessing(scene)) {
    lines.push(`---`, "", `## Channel Processing`, "");
    lines.push(mdTable(["Ch", "Name", "Delay", "Preamp", "Gate", "Dynamics", "EQ", "Main Mix", "Automix"], processingSummary(scene)));
    lines.push("");
  }

  if (opts.includeChannelSends && hasChannelSends(scene)) {
    lines.push(`---`, "", `## Channel Sends`, "");
    lines.push(mdTable(["Ch", "Name", "Bus", "Enabled", "Level", "Pan", "Tap"], sendsSummary(scene)));
    lines.push("");
  }

  if (opts.includeUnrecognizedSummary && parserGroups.length > 0) {
    lines.push(`---`, "", `## Parser Bucket Summary`, "");
    for (const group of parserGroups) {
      lines.push(`### ${group.bucket}`, "");
      lines.push(mdTable(["Category", "Count", "Description"], group.categories.map((c) => [c.category, c.count, c.description])));
      lines.push("");
    }
  }

  if (opts.includeUnrecognizedExamples && parserCategories.length > 0) {
    lines.push(`---`, "", `## Parser Bucket Examples`, "");
    for (const group of parserGroups) {
      lines.push(`### ${group.bucket}`, "");
      for (const c of group.categories) {
        lines.push(`#### ${c.category} (${c.count})`, "", "```txt");
        lines.push(...c.examples);
        lines.push("```", "");
      }
    }
  }

  if (opts.includeRawUnrecognized && scene.unrecognizedLines.length) {
    lines.push(`---`, "", `## Raw Unrecognized Line Sample`, "", "```txt");
    lines.push(...scene.unrecognizedLines);
    lines.push("```", "");
  }

  if (scene.warnings.length) {
    lines.push(`---`, "", `## Warnings`, "");
    for (const w of scene.warnings) lines.push(`- ${w}`);
    lines.push("");
  }

  lines.push(`---`);
  lines.push(`_Generated by X32/M32 RouteView — documentation tool, read-only._`);
  return lines.join("\n");
}

function toCSV(rows: (string | number | undefined)[][]): string {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const s = cell === undefined || cell === null ? "" : String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

/** Single combined CSV with section banners for Inputs / Buses / DCAs / Outputs. */
export function combinedCSV(scene: MixerScene, options?: ExportOptions): string {
  const opts = resolvedOptions(options);
  const parserGroups = groupedParserCategories(scene, opts.parserBucketGroups);
  const parserCategories = filteredParserCategories(scene, opts.parserBucketGroups);
  const sections: string[] = [];

  sections.push(
    toCSV([
      ["# X32/M32 RouteView — Routing Export"],
      ["# File", scene.fileName ?? ""],
      ["# Mixer", scene.mixerType],
      ["# Status", scene.status],
      ["# Generated", new Date(scene.parsedAt).toISOString()],
    ]),
  );

  sections.push(
    toCSV([
      [],
      ["## INPUTS"],
      ["Channel", "Name", "Source", "DCA", "Color", "Notes"],
      ...scene.inputs.map((c) => [c.number, c.name, c.source ?? "", (c.dcaAssignments ?? []).join("; "), c.color ?? "", c.notes ?? ""]),
    ]),
  );

  sections.push(toCSV([[], ["## BUSES"], ["Bus", "Name", "Type", "Notes"], ...scene.buses.map((b) => [b.number, b.name, b.type ?? "", b.notes ?? ""])]));
  sections.push(toCSV([[], ["## DCAs"], ["DCA", "Name", "Assigned Channels"], ...scene.dcas.map((d) => [d.number, d.name, (d.assignedChannels ?? []).join("; ")])]));
  sections.push(toCSV([[], ["## OUTPUTS"], ["Output Type", "Number", "Source", "Notes"], ...scene.outputs.map((o) => [o.outputType, o.number, o.source, o.notes ?? ""])]));

  if (opts.includeSettings && (scene.settings?.length ?? 0) > 0) {
    sections.push(toCSV([[], ["## SETTINGS"], ["Section", "Setting", "Value", "Notes"], ...(scene.settings ?? []).map((s) => [s.section, s.name, s.value, s.notes ?? ""])]));
  }

  if (opts.includeChannelProcessing && hasChannelProcessing(scene)) {
    sections.push(toCSV([[], ["## CHANNEL PROCESSING"], ["Channel", "Name", "Delay", "Preamp", "Gate", "Dynamics", "EQ", "Main Mix", "Automix"], ...processingSummary(scene)]));
  }

  if (opts.includeChannelSends && hasChannelSends(scene)) {
    sections.push(toCSV([[], ["## CHANNEL SENDS"], ["Channel", "Name", "Bus", "Enabled", "Level", "Pan", "Tap"], ...sendsSummary(scene)]));
  }

  if (opts.includeUnrecognizedSummary && parserGroups.length > 0) {
    sections.push(
      toCSV([
        [],
        ["## PARSER BUCKET SUMMARY"],
        ["Bucket", "Category", "Count", "Description"],
        ...parserGroups.flatMap((group) => group.categories.map((c) => [group.bucket, c.category, c.count, c.description])),
      ]),
    );
  }

  if (opts.includeUnrecognizedExamples && parserCategories.length > 0) {
    sections.push(
      toCSV([
        [],
        ["## PARSER BUCKET EXAMPLES"],
        ["Bucket", "Category", "Count", "Example"],
        ...parserGroups.flatMap((group) => group.categories.flatMap((c) => c.examples.map((example) => [group.bucket, c.category, c.count, example]))),
      ]),
    );
  }

  if (opts.includeRawUnrecognized && scene.unrecognizedLines.length) {
    sections.push(toCSV([[], ["## RAW UNRECOGNIZED LINE SAMPLE"], ["Line"], ...scene.unrecognizedLines.map((line) => [line])]));
  }

  return sections.join("\n");
}

export function downloadText(filename: string, contents: string, mime = "text/plain") {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value: string | number | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlTable(headers: string[], rows: (string | number | undefined)[][]): string {
  return `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

export function sceneToHtml(scene: MixerScene, options?: ExportOptions): string {
  const markdown = sceneToMarkdown(scene, options);
  const generated = new Date(scene.parsedAt).toLocaleString();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(scene.fileName ?? "RouteView Documentation")}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #111827; background: #f8fafc; }
    body { margin: 0; padding: 32px; }
    main { max-width: 1120px; margin: 0 auto; background: #fff; border: 1px solid #dbe3ef; border-radius: 12px; padding: 32px; box-shadow: 0 20px 55px -35px rgba(15, 23, 42, .35); }
    h1 { margin: 0 0 8px; font-size: 30px; }
    h2 { margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; font-size: 18px; }
    .meta { color: #475569; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; font-size: 13px; }
    th, td { border: 1px solid #dbe3ef; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    pre { white-space: pre-wrap; background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow: auto; }
    @media print { body { padding: 0; background: #fff; } main { border: 0; box-shadow: none; } }
  </style>
</head>
<body>
  <main>
    <h1>X32 / M32 RouteView Documentation</h1>
    <p class="meta">Generated ${escapeHtml(generated)} from ${escapeHtml(scene.fileName ?? "scene text")}. Processed locally by RouteView.</p>
    <h2>Overview</h2>
    ${htmlTable(["Field", "Value"], [
      ["Mixer", scene.mixerType],
      ["Parse status", scene.status],
      ["Inputs", scene.inputs.length],
      ["Mix buses", scene.buses.length],
      ["DCA groups", scene.dcas.length],
      ["Output patches", scene.outputs.length],
      ["Warnings", scene.warnings.length],
    ])}
    <h2>Inputs</h2>
    ${htmlTable(["Ch", "Name", "Source", "DCA", "Color", "Notes"], scene.inputs.map((c) => [c.number, c.name, c.source ?? "", (c.dcaAssignments ?? []).join(", "), c.color ?? "", c.notes ?? ""]))}
    <h2>Mix Buses</h2>
    ${htmlTable(["Bus", "Name", "Type", "Notes"], scene.buses.map((b) => [b.number, b.name, b.type ?? "", b.notes ?? ""]))}
    <h2>DCA Groups</h2>
    ${htmlTable(["DCA", "Name", "Assigned Channels"], scene.dcas.map((d) => [d.number, d.name, (d.assignedChannels ?? []).join(", ")]))}
    <h2>Output Patches</h2>
    ${htmlTable(["Type", "#", "Source", "Notes"], scene.outputs.map((o) => [o.outputType, o.number, o.source, o.notes ?? ""]))}
    ${scene.warnings.length ? `<h2>Warnings</h2><ul>${scene.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>` : ""}
    <h2>Markdown Source</h2>
    <pre>${escapeHtml(markdown)}</pre>
  </main>
</body>
</html>`;
}

export function sceneToJson(scene: MixerScene): string {
  return JSON.stringify(
    {
      generatedBy: "X32/M32 RouteView",
      generatedAt: new Date(scene.parsedAt).toISOString(),
      privacy: "Processed locally in the browser. Scene data is not uploaded.",
      scene,
    },
    null,
    2,
  );
}

export function sceneToPlainText(scene: MixerScene, options?: ExportOptions): string {
  return sceneToMarkdown(scene, options)
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\|/g, " ")
    .replace(/---/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
