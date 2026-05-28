// X32 / Midas M32 scene (.scn) parser.
// X32 and M32 share the same scene file structure, so a single parser handles both in V1.
//
// Scene file lines look like:
//   /ch/01/config "Kick" 1 YE 33
//   /bus/01/config "Drums" 1 RD
//   /dca/1/config 1 "Band" WH
//   /headamp/000 0 0
//   /outputs/main/01 1 0 OFF
//   /config/routing/IN AN1-8 AN9-16 AES50A-1-8 ...
//
// This parser is intentionally conservative: it extracts what it can recognize,
// stores unknown lines in `unrecognizedLines`, and never throws.
//
// FUTURE EXTENSIONS:
//  - Behringer Wing parser → new file (parsers/wingParser.ts), implements MixerParser
//  - Allen & Heath SQ parser → parsers/sqParser.ts
//  - Yamaha parser → parsers/yamahaParser.ts
//  - M32-specific overrides → branch on `mixerType` detected via header sniff

import type {
  DCAGroup,
  InputChannel,
  MixBus,
  MixerScene,
  OutputPatch,
  OutputType,
  RoutingBlock,
} from "@/types/routing";
import { emptyScene, type MixerParser } from "./mixerParser";

// Match a quoted name like "Kick Drum"
const NAME_RE = /"([^"]*)"/;

function parseChannel(line: string): InputChannel | null {
  // /ch/01/config "Name" <icon?> <color?> <something>
  const m = line.match(/^\/ch\/(\d{1,2})\/config\b\s*(.*)$/);
  if (!m) return null;
  const number = parseInt(m[1], 10);
  const rest = m[2] ?? "";
  const nameMatch = rest.match(NAME_RE);
  const name = nameMatch ? nameMatch[1] : "";
  const tokens = rest.replace(NAME_RE, "").trim().split(/\s+/).filter(Boolean);
  // X32: tokens typically [icon, color, source]
  const icon = tokens[0];
  const color = tokens[1];
  return {
    number,
    name: name || `Ch ${number}`,
    icon,
    color,
  };
}

function parseBus(line: string): MixBus | null {
  const m = line.match(/^\/bus\/(\d{1,2})\/config\b\s*(.*)$/);
  if (!m) return null;
  const number = parseInt(m[1], 10);
  const rest = m[2] ?? "";
  const nameMatch = rest.match(NAME_RE);
  return {
    number,
    name: nameMatch ? nameMatch[1] : `Bus ${number}`,
    type: "Mix Bus",
  };
}

function parseDCA(line: string): DCAGroup | null {
  const m = line.match(/^\/dca\/(\d)\/config\b\s*(.*)$/);
  if (!m) return null;
  const number = parseInt(m[1], 10);
  const rest = m[2] ?? "";
  const nameMatch = rest.match(NAME_RE);
  return {
    number,
    name: nameMatch ? nameMatch[1] : `DCA ${number}`,
    assignedChannels: [],
  };
}

interface OutputPattern {
  re: RegExp;
  type: OutputType;
  numberFrom: (m: RegExpMatchArray) => string | number;
}

const OUTPUT_PATTERNS: OutputPattern[] = [
  { re: /^\/outputs\/main\/(\d{2})\b\s*(.*)$/, type: "XLR", numberFrom: (m) => parseInt(m[1], 10) },
  { re: /^\/outputs\/aux\/(\d{2})\b\s*(.*)$/, type: "Aux", numberFrom: (m) => parseInt(m[1], 10) },
  { re: /^\/outputs\/p16\/(\d{2})\b\s*(.*)$/, type: "Ultranet", numberFrom: (m) => parseInt(m[1], 10) },
  { re: /^\/outputs\/aes\/(\d{2})\b\s*(.*)$/, type: "AES50-A", numberFrom: (m) => parseInt(m[1], 10) },
  { re: /^\/outputs\/rec\/(\d{2})\b\s*(.*)$/, type: "Card", numberFrom: (m) => parseInt(m[1], 10) },
  { re: /^\/config\/routing\/MATRIX\b\s*(.*)$/, type: "Matrix", numberFrom: () => "block" },
];

function parseOutput(line: string): OutputPatch | null {
  for (const p of OUTPUT_PATTERNS) {
    const m = line.match(p.re);
    if (m) {
      const args = (m[m.length - 1] ?? "").trim();
      return {
        outputType: p.type,
        number: p.numberFrom(m),
        source: args || "—",
      };
    }
  }
  return null;
}

function parseRoutingBlock(line: string): RoutingBlock | null {
  // /config/routing/IN  AN1-8 AN9-16 ...
  // /config/routing/OUT 1-8 ...
  // /config/routing/AES50A ...
  const m = line.match(/^\/config\/routing\/([A-Za-z0-9]+)\b\s*(.*)$/);
  if (!m) return null;
  const blockName = m[1];
  const assignments = (m[2] ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { blockName, assignments };
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

    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;

      const ch = parseChannel(line);
      if (ch) {
        channelMap.set(ch.number, { ...(channelMap.get(ch.number) ?? {}), ...ch });
        continue;
      }
      const bus = parseBus(line);
      if (bus) {
        busMap.set(bus.number, bus);
        continue;
      }
      const dca = parseDCA(line);
      if (dca) {
        dcaMap.set(dca.number, dca);
        continue;
      }
      const out = parseOutput(line);
      if (out) {
        scene.outputs.push(out);
        continue;
      }
      const block = parseRoutingBlock(line);
      if (block) {
        scene.routingBlocks.push(block);
        continue;
      }

      // Only record meaningful unrecognized lines (skip generic /-/ tweaks)
      if (line.startsWith("/")) {
        if (scene.unrecognizedLines.length < 500) {
          scene.unrecognizedLines.push(line);
        }
      }
    }

    scene.inputs = Array.from(channelMap.values()).sort((a, b) => a.number - b.number);
    scene.buses = Array.from(busMap.values()).sort((a, b) => a.number - b.number);
    scene.dcas = Array.from(dcaMap.values()).sort((a, b) => a.number - b.number);

    // Status heuristic
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

    if (scene.unrecognizedLines.length) {
      scene.warnings.push(
        `${scene.unrecognizedLines.length} line(s) were not recognized by the parser and stored for debugging.`,
      );
    }

    return scene;
  },
};

export function parseSceneText(
  text: string,
  meta?: { fileName?: string; fileSize?: number },
): MixerScene {
  // V1 only supports X32/M32. Future: iterate registered parsers.
  if (x32M32Parser.canParse(text)) {
    return x32M32Parser.parse(text, meta);
  }
  const scene = emptyScene(meta);
  scene.status = "Unsupported";
  scene.warnings.push(
    "This file does not look like a Behringer X32 or Midas M32 .scn scene. Other mixer formats are not yet supported.",
  );
  return scene;
}
