import type { MixerScene, UnrecognizedCategory } from "@/types/routing";
import { buildVolunteerGuide } from "@/lib/volunteerGuide";
import { channelNumber } from "@/lib/sceneModel";

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
  includeUnrecognizedSummary: false,
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

function condensedInputRows(scene: MixerScene): (string | number | undefined)[][] {
  return scene.inputs
    .filter((input) => input.name?.trim() && !input.name.toLowerCase().includes("unused"))
    .map((input) => [
      `CH ${channelNumber(input.number)}`,
      input.name,
      input.source ?? "Confirm",
      (input.dcaAssignments ?? []).join(", ") || "-",
      (input.sends ?? [])
        .filter((send) => send.enabled && send.level !== "-oo")
        .map((send) => `Bus ${channelNumber(send.bus)} ${send.level}`)
        .join(", ") || "No active sends parsed",
    ]);
}

function condensedBusRows(scene: MixerScene): (string | number | undefined)[][] {
  return scene.buses.map((bus) => {
    const sendingInputs = scene.inputs
      .filter((input) => (input.sends ?? []).some((send) => send.bus === bus.number && send.enabled && send.level !== "-oo"))
      .map((input) => input.name);
    const mappedOutputs = scene.outputs
      .filter((output) => {
        const source = output.source.toLowerCase();
        return source.includes(`bus ${bus.number}`) || source.includes(`bus ${channelNumber(bus.number)}`) || source.includes(bus.name.toLowerCase());
      })
      .map((output) => `${output.outputType} ${output.number}`);
    return [`Bus ${channelNumber(bus.number)}`, bus.name || "Unnamed", bus.type ?? "Mix Bus", sendingInputs.join(", ") || "No active sends parsed", mappedOutputs.join(", ") || "Verify patch"];
  });
}

function condensedDcaRows(scene: MixerScene): (string | number | undefined)[][] {
  return scene.dcas.map((dca) => [`DCA ${dca.number}`, dca.name, (dca.assignedChannels ?? []).map((channel) => `CH ${channelNumber(channel)}`).join(", ") || "Unassigned"]);
}

function condensedOutputRows(scene: MixerScene): (string | number | undefined)[][] {
  return scene.outputs.map((output) => [`${output.outputType} ${output.number}`, output.source, output.notes ?? ""]);
}

export function sceneToMarkdown(scene: MixerScene, options?: ExportOptions): string {
  const opts = resolvedOptions(options);
  const guide = buildVolunteerGuide(scene);
  const parserGroups = groupedParserCategories(scene, opts.parserBucketGroups);
  const parserCategories = filteredParserCategories(scene, opts.parserBucketGroups);
  const lines: string[] = [];

  lines.push(`# ${guide.sceneName} Volunteer Console Guide`);
  lines.push("");
  lines.push("> A practical operating guide for church volunteers, worship leaders, and audio team handoffs.");
  lines.push("");
  lines.push("## Quick Summary");
  lines.push("");
  lines.push(
    mdTable(
      ["Field", "Value"],
      [
        ["Scene", guide.sceneName],
        ["Console", scene.mixerType],
        ["Inputs documented", `${guide.counts.activeInputs} active / ${guide.counts.inputs} parsed`],
        ["Monitor mixes", guide.counts.monitorMixes],
        ["Main outputs", guide.counts.outputs],
        ["Group volume controls", guide.counts.dcas],
        ["Effects found", guide.counts.effects],
        ["Generated", guide.generatedAt],
      ],
    ),
  );
  lines.push("");

  lines.push("## Quick Reference", "");
  lines.push(mdTable(["Area", "What to Check", "Why It Matters"], guide.quickReference.map((item) => [item.label, item.value, item.note])));
  lines.push("");

  lines.push("## Professional Condensed Routing Chart", "");
  lines.push("### Inputs and Sends", "");
  lines.push(mdTable(["Ch", "Input", "Source", "DCA", "Active Sends"], condensedInputRows(scene)));
  lines.push("");
  lines.push("### Buses", "");
  lines.push(mdTable(["Bus", "Name", "Type", "Feeds From", "Output"], condensedBusRows(scene)));
  lines.push("");
  lines.push("### DCAs", "");
  lines.push(mdTable(["DCA", "Name", "Assigned Channels"], condensedDcaRows(scene)));
  lines.push("");
  lines.push("### Outputs", "");
  lines.push(mdTable(["Output", "Source", "Notes"], condensedOutputRows(scene)));
  lines.push("");

  lines.push("## Console Overview", "");
  lines.push("This scene was parsed locally by RouteView. Use this guide as an operating handoff, not as a replacement for listening in the room.");
  if (scene.warnings.length) {
    lines.push("");
    lines.push(`**Review before service:** ${scene.warnings.length} item${scene.warnings.length === 1 ? "" : "s"} could not be fully explained. Check troubleshooting and advanced details before relying on unsupported scene details.`);
  }
  lines.push("");

  lines.push("## Input Channels", "");
  if (guide.activeInputs.length) {
    lines.push(
      mdTable(
        ["Channel", "Name", "Source", "Group Volume Control", "Volunteer Note"],
        guide.activeInputs.map((input) => [
          input.channel.number,
          input.label,
          input.channel.source ?? "",
          input.dcas.join(", "),
          input.channel.notes || "Confirm label and source during line check.",
        ]),
      ),
    );
  } else {
    lines.push("No active input labels were found. Review the console scene before handing this to a volunteer.");
  }
  lines.push("");

  lines.push("## Monitor Mixes", "");
  if (guide.monitorMixes.length) {
    for (const mix of guide.monitorMixes) {
      lines.push(`### ${mix.label}`);
      lines.push("");
      lines.push(`- **Purpose:** ${mix.purpose}`);
      lines.push(`- **Mapped outputs:** ${mix.mappedOutputs.map((output) => `${output.outputType} ${output.number}`).join(", ") || "No mapped physical output found."}`);
      lines.push(`- **Common sources:** ${mix.sendingInputs.map((input) => input.label).join(", ") || "No active sends parsed."}`);
      lines.push("");
    }
  } else {
    lines.push("No active monitor mixes were detected from parsed sends. Confirm monitor routing on the console before service.");
  }
  lines.push("");

  lines.push("## Main Outputs", "");
  if (guide.mainOutputs.length) {
    lines.push(mdTable(["Output", "Source", "Practical Meaning"], guide.mainOutputs.map((item) => [item.label, item.output.source, item.purpose])));
  } else {
    lines.push("No active outputs were detected. Verify console routing before sharing this guide.");
  }
  lines.push("");

  lines.push("## Group Volume Controls", "");
  lines.push(
    mdTable(
      ["Console Label", "Name", "Controls"],
      guide.dcaGroups.map((dca) => [dca.number, dca.name, dca.assignedInputs.length ? dca.assignedInputs.map((input) => input.label).join(", ") : "Unassigned"]),
    ),
  );
  lines.push("");

  lines.push("## Effects", "");
  if (guide.effects.length) {
    for (const effect of guide.effects) lines.push(`- **${effect.label}:** ${effect.detail}`);
  } else {
    lines.push("No named effects were detected in the parsed scene. Check the console effects rack if effects are used in service.");
  }
  lines.push("");

  lines.push("## Volunteer Notes", "");
  for (const tip of guide.volunteerTips) lines.push(`- ${tip}`);
  lines.push("");

  lines.push("## Service-Day Tips", "");
  lines.push("- Line check every active input before rehearsal starts.");
  lines.push("- Confirm pastor, worship leader, speaking mics, playback, and livestream audio before doors open.");
  lines.push("- Keep this guide available at front-of-house or in the team shared folder.");
  lines.push("");

  lines.push("## Troubleshooting", "");
  for (const item of guide.troubleshooting) lines.push(`- ${item}`);
  lines.push("");

  const includeAdvanced =
    opts.includeSettings ||
    opts.includeChannelProcessing ||
    opts.includeChannelSends ||
    opts.includeUnrecognizedSummary ||
    opts.includeUnrecognizedExamples ||
    opts.includeRawUnrecognized ||
    scene.routingBlocks.length > 0 ||
    scene.warnings.length > 0;

  if (includeAdvanced) {
    lines.push("---", "", "## Advanced Console Details", "");
    lines.push("This section is mainly for technical directors and advanced users. It may include AES50, Ultranet, patching, matrices, items RouteView could not fully explain, unknown scene lines, and raw routing details.", "");
  }

  if (scene.routingBlocks.length) {
    lines.push("### Routing Blocks", "");
    for (const r of scene.routingBlocks) lines.push(`- **${r.blockName}** - ${r.assignments.join(", ")}`);
    lines.push("");
  }

  if (opts.includeSettings && (scene.settings?.length ?? 0) > 0) {
    lines.push("### Console Settings", "");
    lines.push(mdTable(["Section", "Setting", "Value", "Notes"], (scene.settings ?? []).map((s) => [s.section, s.name, s.value, s.notes ?? ""])));
    lines.push("");
  }

  if (opts.includeChannelProcessing && hasChannelProcessing(scene)) {
    lines.push("### Channel Processing", "");
    lines.push(mdTable(["Ch", "Name", "Delay", "Preamp", "Gate", "Dynamics", "EQ", "Main Mix", "Automix"], processingSummary(scene)));
    lines.push("");
  }

  if (opts.includeChannelSends && hasChannelSends(scene)) {
    lines.push("### Channel Sends", "");
    lines.push(mdTable(["Ch", "Name", "Bus", "Enabled", "Level", "Pan", "Tap"], sendsSummary(scene)));
    lines.push("");
  }

  if (opts.includeUnrecognizedSummary && parserGroups.length > 0) {
    lines.push("### Items RouteView Could Not Fully Explain", "");
    for (const group of parserGroups) {
      lines.push(`#### ${group.bucket}`, "");
      lines.push(mdTable(["Category", "Count", "Description"], group.categories.map((c) => [c.category, c.count, c.description])));
      lines.push("");
    }
  }

  if (opts.includeUnrecognizedExamples && parserCategories.length > 0) {
    lines.push("### Examples RouteView Could Not Fully Explain", "");
    for (const group of parserGroups) {
      lines.push(`#### ${group.bucket}`, "");
      for (const c of group.categories) {
        lines.push(`##### ${c.category} (${c.count})`, "", "```txt");
        lines.push(...c.examples);
        lines.push("```", "");
      }
    }
  }

  if (opts.includeRawUnrecognized && scene.unrecognizedLines.length) {
    lines.push("### Unknown Scene Line Sample", "", "```txt");
    lines.push(...scene.unrecognizedLines);
    lines.push("```", "");
  }

  if (scene.warnings.length) {
    lines.push("### Warnings", "");
    for (const w of scene.warnings) lines.push(`- ${w}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("_Generated by RouteView - documentation tool, read-only._");
  return lines.join("\n");
}

function legacySceneToMarkdown(scene: MixerScene, options?: ExportOptions): string {
  const opts = resolvedOptions(options);
  const parserGroups = groupedParserCategories(scene, opts.parserBucketGroups);
  const parserCategories = filteredParserCategories(scene, opts.parserBucketGroups);
  const lines: string[] = [];

  lines.push(`# RouteView — Routing Documentation`);
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
  lines.push(`_Generated by RouteView — documentation tool, read-only._`);
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
      ["# RouteView — Routing Export"],
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
    <h1>RouteView Documentation</h1>
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
    <h2>Professional Condensed Routing Chart</h2>
    <h2>Inputs and Sends</h2>
    ${htmlTable(["Ch", "Input", "Source", "DCA", "Active Sends"], condensedInputRows(scene))}
    <h2>Mix Buses</h2>
    ${htmlTable(["Bus", "Name", "Type", "Feeds From", "Output"], condensedBusRows(scene))}
    <h2>DCA Groups</h2>
    ${htmlTable(["DCA", "Name", "Assigned Channels"], condensedDcaRows(scene))}
    <h2>Output Patches</h2>
    ${htmlTable(["Output", "Source", "Notes"], condensedOutputRows(scene))}
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
      generatedBy: "RouteView",
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
