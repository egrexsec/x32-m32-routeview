// Shared data models for mixer routing documentation.
// Kept simple and extensible — additional mixer formats can reuse these.

export type MixerType = "X32/M32" | "Unknown";

export type OutputType =
  | "XLR"
  | "Aux"
  | "AES50-A"
  | "AES50-B"
  | "Card"
  | "Ultranet"
  | "Matrix"
  | "Unknown";

export type ParseStatus = "Parsed" | "Partial" | "Missing Data" | "Unsupported";

export interface SceneSetting {
  section: string;
  name: string;
  value: string;
  notes?: string;
}

export interface ChannelSend {
  bus: number;
  enabled: boolean;
  level: string;
  pan?: string;
  tap?: string;
}

export interface ChannelProcessingSnapshot {
  delay?: string;
  preamp?: string;
  gate?: string;
  dynamics?: string;
  insert?: string;
  eq?: string;
  mainMix?: string;
  automix?: string;
}

export interface InputChannel {
  number: number;
  name: string;
  source?: string;
  color?: string;
  icon?: string;
  dcaAssignments?: string[];
  processing?: ChannelProcessingSnapshot;
  sends?: ChannelSend[];
  notes?: string;
}

export interface MixBus {
  number: number;
  name: string;
  type?: string;
  notes?: string;
}

export interface DCAGroup {
  number: number;
  name: string;
  assignedChannels?: number[];
}

export interface OutputPatch {
  outputType: OutputType;
  number: number | string;
  source: string;
  notes?: string;
}

export interface RoutingBlock {
  blockName: string;
  assignments: string[];
}

export interface MixerScene {
  mixerType: MixerType;
  fileName?: string;
  fileSize?: number;
  parsedAt: string;
  status: ParseStatus;
  inputs: InputChannel[];
  buses: MixBus[];
  dcas: DCAGroup[];
  outputs: OutputPatch[];
  routingBlocks: RoutingBlock[];
  settings: SceneSetting[];
  warnings: string[];
  unrecognizedLines: string[];
}
