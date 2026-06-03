// X32 / Midas M32 scene (.scn) parser.
// X32 and M32 share the same scene file structure, so a single parser handles both in V1.
//
// Scene file lines look like:
//   /ch/01/config "Kick" 1 YE 33
//   /ch/01/grp %00000001 %000000
//   /ch/01/preamp +0.0 ON OFF 24 66
//   /ch/01/mix/01 ON -21.0 +0 PRE 0
//   /bus/01/config "Drums" 1 RD
//   /dca/1/config "Band" WH
//   /outputs/main/01 4 POST OFF
//   /config/routing/IN AN1-8 AN9-16 AES50A-1-8 ...
//
// This parser is intentionally conservative: it extracts what it can recognize,
// categorizes unknown lines for visibility, stores a capped raw debug sample,
// and never throws.

import type {
  DCAGroup,
  InputChannel,
  MixBus,
  MixerScene,
  OutputPatch,
  OutputType,
  RoutingBlock,
  UnrecognizedCategory,
} from "@/types/routing";
import { emptyScene, type MixerParser } from "./mixerParser";

const NAME_RE = /"([^"]*)"/;
const MAX_UNRECOGNIZED_RAW_LINES = 500;
const MAX_UNRECOGNIZED_EXAMPLES_PER_CATEGORY = 5;

type UnrecognizedCategoryKey =
  | "Channel Delay"
  | "Channel Preamp"
  | "Channel Gate"
  | "Channel Dynamics"
  | "Channel Insert"
  | "Channel EQ"
  | "Channel Sends"
  | "Channel Automix"
  | "Aux Channel Processing"
  | "FX Return Processing"
  | "Bus Processing"
  | "Matrix Processing"
  | "Main/Mono Processing"
  | "Output Detail Settings"
  | "Console Config"
  | "Routing Detail"
  | "User Routing"
  | "User Controls"
  | "Talkback"
  | "DP48"
  | "Mute Groups"
  | "Effects Rack"
  | "Headamp"
  | "Scene Metadata"
  | "Miscellaneous";

const UNRECOGNIZED_CATEGORY_DESCRIPTIONS: Record<UnrecognizedCategoryKey, string> = {
  "Channel Delay": "Per-channel delay enable/time values that are useful for engineering views.",
  "Channel Preamp": "Per-channel preamp gain, phantom power, polarity, and source-trim style values.",
  "Channel Gate": "Per-channel gate/expander settings and sidechain filter values.",
  "Channel Dynamics": "Per-channel compressor/dynamics settings and sidechain filter values.",
  "Channel Insert": "Per-channel insert enable, position, and insert source selections.",
  "Channel EQ": "Per-channel EQ enable and band settings.",
  "Channel Sends": "Per-channel main mix and bus-send levels, pan, mute, and tap-point data.",
  "Channel Automix": "Per-channel automix enable and weighting values.",
  "Aux Channel Processing": "Aux input processing, EQ, dynamics, inserts, and sends.",
  "FX Return Processing": "FX return processing, EQ, inserts, and sends.",
  "Bus Processing": "Mix bus processing, EQ, dynamics, inserts, and send/master settings.",
  "Matrix Processing": "Matrix bus processing, EQ, dynamics, inserts, and send/master settings.",
  "Main/Mono Processing": "Main LR/M/C processing, EQ, dynamics, inserts, and mix settings.",
  "Output Detail Settings": "Output delay, polarity, iQ, and other output child settings that are not output patch assignments.",
  "Console Config": "Global console configuration such as linking, solo, mono, oscillator, tape, and automix settings.",
  "Routing Detail": "Routing blocks or routing subcommands not yet normalized into the main routing tables.",
  "User Routing": "User-defined input/output routing tables.",
  "User Controls": "Assignable control bank colors, encoders, and buttons.",
  "Talkback": "Talkback source, level, destination, and routing data.",
  "DP48": "DP48 personal monitor assignment, link, and group-name data.",
  "Mute Groups": "Mute group configuration and membership data.",
  "Effects Rack": "Effects rack slot, type, source, return, and parameter data.",
  Headamp: "Physical preamp/headamp gain, phantom, and hardware-level data.",
  "Scene Metadata": "Scene, snippet, safes, cue, show, or metadata lines.",
  Miscellaneous: "Unmatched X32/M32 scene commands that need future parser support.",
};

function cleanLabel(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? "").trim();
  return trimmed || fallback;
}

function decodeBitMask(mask: string | undefined, maxBits: number): number[] {
  if (!mask?.startsWith("%")) return [];
  const bits = mask.slice(1);
  const out: number[] = [];
  for (let i = bits.length - 1, group = 1; i >= 0 && group <= maxBits; i -= 1, group += 1) {
    if (bits[i] === "1") out.push(group);
  }
  return out;
}

function ensureChannel(channelMap: Map<number, InputChannel>, number: number): InputChannel {
  const existing = channelMap.get(number);
  if (existing) return existing;
  const created: InputChannel = { number, name: `Ch ${number}` };
  channelMap.set(number, created);
  return created;
}

function parseChannel(line: string): InputChannel | null {
  const m = line.match(/^\/ch\/(\d{1,2})\/config\b\s*(.*)$/);
  if (!m) return null;
  const number = parseInt(m[1], 10);
  const rest = m[2] ?? "";
  const nameMatch = rest.match(NAME_RE);
  const tokens = rest.replace(NAME_RE, "").trim().split(/\s+/).filter(Boolean);
  const icon = tokens[0];
  const color = tokens[1];
  const source = tokens[2];
  return { number, name: cleanLabel(nameMatch?.[1], `Ch ${number}`), source, icon, color };
}

function parseChannelDcaAssignment(line: string): { channel: number; dcas: number[] } | null {
  const m = line.match(/^\/ch\/(\d{1,2})\/grp\b\s+(%[01]{8})\b/);
  if (!m) return null;
  return { channel: parseInt(m[1], 10), dcas: decodeBitMask(m[2], 8) };
}

function normalizeSendTap(value?: string): string | undefined {
  const tap = value?.toUpperCase();
  if (!tap) return undefined;
  if (tap.includes("PRE")) return "PRE-FADER";
  if (tap.includes("POST")) return "POST-FADER";
  if (tap.includes("EQ")) return "POST-EQ";
  return tap;
}

function parseChannelPreamp(line: string): { channel: number; summary: string } | null {
  const m = line.match(/^\/ch\/(\d{1,2})\/preamp\b\s+(.+)$/);
  if (!m) return null;
  const channel = parseInt(m[1], 10);
  const tokens = m[2].trim().split(/\s+/).filter(Boolean);
  const gain = tokens[0] ?? "—";
  const phantom = tokens[1] ? `48V ${tokens[1]}` : undefined;
  const polarity = tokens[2] ? `Pol ${tokens[2]}` : undefined;
  const padOrFilter = tokens[3] ? `Pad/HPF ${tokens[3]}` : undefined;
  return { channel, summary: [`Gain ${gain}`, phantom, polarity, padOrFilter].filter(Boolean).join("; ") };
}

function parseChannelSend(line: string): { channel: number; send: NonNullable<InputChannel["sends"]>[number] } | null {
  const m = line.match(/^\/ch\/(\d{1,2})\/mix\/(\d{2})\b\s+(.+)$/);
  if (!m) return null;
  const channel = parseInt(m[1], 10);
  const bus = parseInt(m[2], 10);
  const tokens = m[3].trim().split(/\s+/).filter(Boolean);
  const enabled = tokens[0] === "ON";
  const level = tokens[1] ?? "—";
  const tapToken = tokens.find((token) => /PRE|POST|EQ->/i.test(token));
  const pan = tokens.find((token, index) => index > 1 && /^[-+]?\d+$/.test(token));
  return { channel, send: { bus, enabled, level, pan, tap: normalizeSendTap(tapToken) } };
}

function parseBus(line: string): MixBus | null {
  const m = line.match(/^\/bus\/(\d{1,2})\/config\b\s*(.*)$/);
  if (!m) return null;
  const number = parseInt(m[1], 10);
  const rest = m[2] ?? "";
  const nameMatch = rest.match(NAME_RE);
  return { number, name: cleanLabel(nameMatch?.[1], `Bus ${number}`), type: "Mix Bus" };
}

function parseDCA(line: string): DCAGroup | null {
  const m = line.match(/^\/dca\/(\d)\/config\b\s*(.*)$/);
  if (!m) return null;
  const number = parseInt(m[1], 10);
  const rest = m[2] ?? "";
  const nameMatch = rest.match(NAME_RE);
  return { number, name: cleanLabel(nameMatch?.[1], `DCA ${number}`), assignedChannels: [] };
}

interface OutputPattern { re: RegExp; type: OutputType; numberFrom: (m: RegExpMatchArray) => string | number; }
const OUTPUT_PATTERNS: OutputPattern[] = [
  { re: /^\/outputs\/main\/(\d{2})\s+(.+)$/, type: "XLR", numberFrom: (m) => parseInt(m[1], 10) },
  { re: /^\/outputs\/aux\/(\d{2})\s+(.+)$/, type: "Aux", numberFrom: (m) => parseInt(m[1], 10) },
  { re: /^\/outputs\/p16\/(\d{2})\s+(.+)$/, type: "Ultranet", numberFrom: (m) => parseInt(m[1], 10) },
  { re: /^\/outputs\/aes\/(\d{2})\s+(.+)$/, type: "AES50-A", numberFrom: (m) => parseInt(m[1], 10) },
  { re: /^\/outputs\/rec\/(\d{2})\s+(.+)$/, type: "Card", numberFrom: (m) => parseInt(m[1], 10) },
  { re: /^\/config\/routing\/MATRIX\b\s*(.*)$/, type: "Matrix", numberFrom: () => "block" },
];

function describeOutputSource(code: string): string {
  const sourceCode = Number.parseInt(code, 10);
  if (Number.isNaN(sourceCode)) return code;
  if (sourceCode === 0) return "Off";
  if (sourceCode === 1) return "Main L";
  if (sourceCode === 2) return "Main R";
  if (sourceCode === 3) return "Main M/C";
  if (sourceCode >= 4 && sourceCode <= 19) return `Bus ${sourceCode - 3}`;
  if (sourceCode >= 20 && sourceCode <= 25) return `Matrix ${sourceCode - 19}`;
  if (sourceCode >= 26 && sourceCode <= 57) return `Direct Ch ${sourceCode - 25}`;
  if (sourceCode >= 58 && sourceCode <= 65) return `Aux In ${sourceCode - 57}`;
  if (sourceCode >= 66 && sourceCode <= 73) return `FX Return ${sourceCode - 65}`;
  return `Source ${sourceCode}`;
}

function parseOutput(line: string): OutputPatch | null {
  for (const p of OUTPUT_PATTERNS) {
    const m = line.match(p.re);
    if (m) {
      const args = (m[m.length - 1] ?? "").trim().split(/\s+/).filter(Boolean);
      const sourceCode = args[0] ?? "";
      const tap = args[1];
      const option = args[2];
      const notes = [tap ? `Tap: ${tap}` : undefined, option ? `Option: ${option}` : undefined, /^\d+$/.test(sourceCode) ? `Raw source: ${sourceCode}` : undefined].filter(Boolean).join("; ");
      return { outputType: p.type, number: p.numberFrom(m), source: sourceCode ? describeOutputSource(sourceCode) : "—", notes };
    }
  }
  return null;
}

function parseRoutingBlock(line: string): RoutingBlock | null {
  const m = line.match(/^\/config\/routing\/([A-Za-z0-9]+)\b\s*(.*)$/);
  if (!m) return null;
  const blockName = m[1];
  const assignments = (m[2] ?? "").trim().split(/\s+/).filter(Boolean);
  return { blockName, assignments };
}

function prettyInputRange(token: string, channelOffset: number): string | undefined {
  const normalized = token.toUpperCase();
  const range = normalized.match(/^(AN|AUX|CARD|A|B|AES50A|AES50B)-?(\d+)(?:-(\d+))?$/);
  if (!range) return token;

  const prefix = range[1];
  const start = parseInt(range[2], 10);
  const label =
    prefix === "AN"
      ? "Local In"
      : prefix === "A" || prefix === "AES50A"
        ? "AES50-A"
        : prefix === "B" || prefix === "AES50B"
          ? "AES50-B"
          : prefix === "AUX"
            ? "Aux In"
            : "Card";

  return `${label} ${start + channelOffset}`;
}

function inputSourcesFromRouting(assignments: string[]): Map<number, string> {
  const map = new Map<number, string>();
  assignments.slice(0, 4).forEach((token, blockIndex) => {
    for (let offset = 0; offset < 8; offset += 1) {
      const channel = blockIndex * 8 + offset + 1;
      const source = prettyInputRange(token, offset);
      if (source) map.set(channel, source);
    }
  });
  return map;
}

function categorizeUnrecognizedLine(line: string): UnrecognizedCategoryKey {
  if (/^\/ch\/\d{1,2}\/delay\b/.test(line)) return "Channel Delay";
  if (/^\/ch\/\d{1,2}\/preamp\b/.test(line)) return "Channel Preamp";
  if (/^\/ch\/\d{1,2}\/gate\b/.test(line)) return "Channel Gate";
  if (/^\/ch\/\d{1,2}\/dyn\b/.test(line)) return "Channel Dynamics";
  if (/^\/ch\/\d{1,2}\/insert\b/.test(line)) return "Channel Insert";
  if (/^\/ch\/\d{1,2}\/eq\b/.test(line)) return "Channel EQ";
  if (/^\/ch\/\d{1,2}\/mix(?:\/\d{2})?\b/.test(line)) return "Channel Sends";
  if (/^\/ch\/\d{1,2}\/automix\b/.test(line)) return "Channel Automix";
  if (/^\/auxin\/\d{2}\//.test(line)) return "Aux Channel Processing";
  if (/^\/fxrtn\/\d{2}\//.test(line)) return "FX Return Processing";
  if (/^\/bus\/\d{1,2}\//.test(line)) return "Bus Processing";
  if (/^\/mtx\/\d{1,2}\//.test(line)) return "Matrix Processing";
  if (/^\/(main|mono|lr|m)\//.test(line)) return "Main/Mono Processing";
  if (/^\/outputs\//.test(line)) return "Output Detail Settings";
  if (/^\/config\/userctrl\//.test(line)) return "User Controls";
  if (/^\/config\/userrout\//.test(line)) return "User Routing";
  if (/^\/config\/talk\b/.test(line) || /^\/config\/talk\//.test(line)) return "Talkback";
  if (/^\/config\/dp48\b/.test(line) || /^\/config\/dp48\//.test(line)) return "DP48";
  if (/^\/config\/routing\b/.test(line) || /^\/config\/routing\//.test(line)) return "Routing Detail";
  if (/^\/config\//.test(line)) return "Console Config";
  if (/^\/mute\//.test(line) || /^\/config\/mute\b/.test(line)) return "Mute Groups";
  if (/^\/fx\//.test(line)) return "Effects Rack";
  if (/^\/headamp\//.test(line)) return "Headamp";
  if (/^\/(scene|snippet|safes|cue|show)\b/.test(line)) return "Scene Metadata";
  return "Miscellaneous";
}

function addUnrecognizedLine(categoryMap: Map<UnrecognizedCategoryKey, UnrecognizedCategory>, scene: MixerScene, line: string) {
  const category = categorizeUnrecognizedLine(line);
  const current = categoryMap.get(category) ?? { category, description: UNRECOGNIZED_CATEGORY_DESCRIPTIONS[category], count: 0, examples: [] };
  current.count += 1;
  if (current.examples.length < MAX_UNRECOGNIZED_EXAMPLES_PER_CATEGORY) current.examples.push(line);
  categoryMap.set(category, current);
  if (scene.unrecognizedLines.length < MAX_UNRECOGNIZED_RAW_LINES) scene.unrecognizedLines.push(line);
}

function detectIsX32Scene(text: string): boolean {
  return /^#\s*\d+\.\d+/m.test(text) || /\/ch\/\d{2}\/config/.test(text) || /\/bus\/\d{2}\/config/.test(text);
}

export const x32M32Parser: MixerParser = {
  id: "X32/M32",
  canParse: detectIsX32Scene,
  parse(text, meta) {
    const scene: MixerScene = emptyScene(meta);
    scene.mixerType = "X32/M32";
    const lines = text.split(/\r?\n/);
    const channelMap = new Map<number, InputChannel>();
    const busMap = new Map<number, MixBus>();
    const dcaMap = new Map<number, DCAGroup>();
    const channelDcaMap = new Map<number, number[]>();
    const unrecognizedCategoryMap = new Map<UnrecognizedCategoryKey, UnrecognizedCategory>();
    let inputRouting: RoutingBlock | undefined;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;

      const ch = parseChannel(line);
      if (ch) { channelMap.set(ch.number, { ...(channelMap.get(ch.number) ?? {}), ...ch }); continue; }

      const chDca = parseChannelDcaAssignment(line);
      if (chDca) { channelDcaMap.set(chDca.channel, chDca.dcas); continue; }

      const preamp = parseChannelPreamp(line);
      if (preamp) {
        const channel = ensureChannel(channelMap, preamp.channel);
        channel.processing = { ...(channel.processing ?? {}), preamp: preamp.summary };
        continue;
      }

      const send = parseChannelSend(line);
      if (send) {
        const channel = ensureChannel(channelMap, send.channel);
        const existingSends = (channel.sends ?? []).filter((item) => item.bus !== send.send.bus);
        channel.sends = [...existingSends, send.send].sort((a, b) => a.bus - b.bus);
        continue;
      }

      const bus = parseBus(line);
      if (bus) { busMap.set(bus.number, bus); continue; }

      const dca = parseDCA(line);
      if (dca) { dcaMap.set(dca.number, dca); continue; }

      const out = parseOutput(line);
      if (out) { scene.outputs.push(out); continue; }

      const block = parseRoutingBlock(line);
      if (block) { scene.routingBlocks.push(block); if (block.blockName === "IN") inputRouting = block; continue; }

      if (line.startsWith("/")) addUnrecognizedLine(unrecognizedCategoryMap, scene, line);
    }

    const inputSourceMap = inputRouting ? inputSourcesFromRouting(inputRouting.assignments) : new Map<number, string>();

    for (const [channel, dcas] of channelDcaMap) {
      const ch = channelMap.get(channel);
      if (!ch) continue;
      ch.dcaAssignments = dcas.map((dcaNumber) => dcaMap.get(dcaNumber)?.name ?? `DCA ${dcaNumber}`);
      ch.source = inputSourceMap.get(channel) ?? ch.source;
      for (const dcaNumber of dcas) {
        const dca = dcaMap.get(dcaNumber);
        if (dca) dca.assignedChannels = [...(dca.assignedChannels ?? []), channel].sort((a, b) => a - b);
      }
    }

    for (const [channel, ch] of channelMap) ch.source = inputSourceMap.get(channel) ?? ch.source;

    scene.inputs = Array.from(channelMap.values()).sort((a, b) => a.number - b.number);
    scene.buses = Array.from(busMap.values()).sort((a, b) => a.number - b.number);
    scene.dcas = Array.from(dcaMap.values()).sort((a, b) => a.number - b.number);
    scene.unrecognizedCategories = Array.from(unrecognizedCategoryMap.values()).sort((a, b) => b.count - a.count);

    const hasAny = scene.inputs.length || scene.buses.length || scene.outputs.length;
    if (!hasAny) {
      scene.status = "Missing Data";
      scene.warnings.push("No recognizable X32/M32 routing entries were found in this file.");
    } else if (scene.inputs.length && scene.buses.length && scene.outputs.length) {
      scene.status = "Parsed";
    } else {
      scene.status = "Partial";
      scene.warnings.push("Some sections (inputs, buses, or outputs) were missing or unrecognized.");
    }

    const miscellaneousCount = scene.unrecognizedCategories
      .filter((category) => category.category === "Miscellaneous")
      .reduce((sum, category) => sum + category.count, 0);
    if (miscellaneousCount > 0) scene.warnings.push(`${miscellaneousCount} uncategorized parser line(s) need future parser support.`);

    return scene;
  },
};

export function parseSceneText(text: string, meta?: { fileName?: string; fileSize?: number }): MixerScene {
  if (x32M32Parser.canParse(text)) return x32M32Parser.parse(text, meta);
  const scene = emptyScene(meta);
  scene.status = "Unsupported";
  scene.warnings.push("This file does not look like a Behringer X32 or Midas M32 .scn scene. Other mixer formats are not yet supported.");
  return scene;
}
