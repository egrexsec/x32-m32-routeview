// Shared parser interface. Future mixers (Wing, SQ, Yamaha) implement this.
import type { MixerScene } from "@/types/routing";

export interface MixerParser {
  /** Friendly format id, e.g. "X32/M32" */
  id: string;
  /** Quick sniff to decide if this parser should handle the file */
  canParse: (text: string) => boolean;
  /** Run the parser. Should never throw — return warnings instead. */
  parse: (text: string, meta?: { fileName?: string; fileSize?: number }) => MixerScene;
}

export function emptyScene(meta?: { fileName?: string; fileSize?: number }): MixerScene {
  return {
    mixerType: "Unknown",
    fileName: meta?.fileName,
    fileSize: meta?.fileSize,
    parsedAt: new Date().toISOString(),
    status: "Missing Data",
    inputs: [],
    buses: [],
    dcas: [],
    outputs: [],
    routingBlocks: [],
    settings: [],
    warnings: [],
    unrecognizedLines: [],
  };
}
