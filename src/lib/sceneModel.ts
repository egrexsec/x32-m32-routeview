import type { ChannelSend, InputChannel, MixerScene, MixBus, OutputPatch, RoutingBlock } from "@/types/routing";

export interface DerivedInput {
  channel: InputChannel;
  isActive: boolean;
  activeSends: ChannelSend[];
}

export interface DerivedBus {
  bus: MixBus;
  isActive: boolean;
  sendingInputs: { channel: InputChannel; send: ChannelSend }[];
  mappedOutputs: OutputPatch[];
}

export interface OutputBank {
  title: string;
  outputType: string;
  start: number;
  end: number;
  outputs: OutputPatch[];
}

export interface SignalTrace {
  id: string;
  input: InputChannel;
  bus?: MixBus;
  send?: ChannelSend;
  outputs: OutputPatch[];
  path: string[];
}

export interface DerivedSceneModel {
  inputs: DerivedInput[];
  activeInputs: DerivedInput[];
  buses: DerivedBus[];
  activeBuses: DerivedBus[];
  outputBanks: OutputBank[];
  activeOutputBanks: OutputBank[];
  signalTraces: SignalTrace[];
  routingBlocks: RoutingBlock[];
}

export function channelNumber(n: number): string {
  return n.toString().padStart(2, "0");
}

export function channelDisplayName(channel: InputChannel): string {
  return channel.name?.trim() || `Ch ${channel.number}`;
}

export function isDefaultOrUnusedInput(channel: InputChannel): boolean {
  const normalized = channel.name?.trim().toLowerCase() ?? "";
  return (
    !normalized ||
    normalized === `ch ${channel.number}` ||
    normalized === `channel ${channel.number}` ||
    normalized === channelNumber(channel.number) ||
    normalized.includes("unused")
  );
}

export function isActiveSend(send: ChannelSend): boolean {
  return send.enabled && send.level !== "-oo" && send.level !== "—";
}

function outputSourceMatchesBus(output: OutputPatch, busNumber: number): boolean {
  const normalized = output.source.trim().toLowerCase();
  return normalized === `bus ${busNumber}` || normalized === `mix bus ${busNumber}`;
}

function outputSourceMatchesInput(output: OutputPatch, channelNumberValue: number): boolean {
  const normalized = output.source.trim().toLowerCase();
  return normalized === `direct ch ${channelNumberValue}` || normalized === `ch ${channelNumberValue}` || normalized === `channel ${channelNumberValue}`;
}

function isMappedOutput(output: OutputPatch): boolean {
  const source = output.source.trim().toLowerCase();
  return !!source && source !== "—" && source !== "off";
}

function outputBanks(outputs: OutputPatch[], size = 4): OutputBank[] {
  const groups = new Map<string, OutputPatch[]>();
  for (const output of outputs) {
    const key = output.outputType || "Unknown";
    groups.set(key, [...(groups.get(key) ?? []), output]);
  }

  const banks: OutputBank[] = [];
  for (const [outputType, rows] of groups) {
    const numericRows = rows.filter((output) => Number.isFinite(Number(output.number)));
    const nonNumericRows = rows.filter((output) => !Number.isFinite(Number(output.number)));
    const max = numericRows.reduce((highest, output) => Math.max(highest, Number(output.number)), 0);
    const bankCount = Math.max(0, Math.ceil(max / size));

    for (let index = 0; index < bankCount; index += 1) {
      const start = index * size + 1;
      const end = start + size - 1;
      banks.push({
        title: `${outputType} ${start}-${end}`,
        outputType,
        start,
        end,
        outputs: numericRows.filter((output) => Number(output.number) >= start && Number(output.number) <= end),
      });
    }

    if (nonNumericRows.length) {
      banks.push({ title: `${outputType} Blocks`, outputType, start: 0, end: 0, outputs: nonNumericRows });
    }
  }

  return banks;
}

export function buildDerivedSceneModel(scene: MixerScene): DerivedSceneModel {
  const inputs: DerivedInput[] = scene.inputs.map((channel) => {
    const activeSends = (channel.sends ?? []).filter(isActiveSend);
    const hasDca = (channel.dcaAssignments ?? []).length > 0;
    const hasSource = !!channel.source && channel.source !== "—";
    const hasProcessing = !!channel.processing && Object.values(channel.processing).some(Boolean);
    const isActive = !isDefaultOrUnusedInput(channel) || activeSends.length > 0 || hasDca || hasSource || hasProcessing;
    return { channel, isActive, activeSends };
  });

  const buses: DerivedBus[] = scene.buses.map((bus) => {
    const sendingInputs = scene.inputs
      .map((channel) => {
        const send = (channel.sends ?? []).find((item) => item.bus === bus.number);
        return send && isActiveSend(send) ? { channel, send } : null;
      })
      .filter(Boolean) as { channel: InputChannel; send: ChannelSend }[];
    const mappedOutputs = scene.outputs.filter((output) => outputSourceMatchesBus(output, bus.number));
    const isActive = sendingInputs.length > 0 || mappedOutputs.length > 0 || !/^bus\s*\d+$/i.test(bus.name.trim());
    return { bus, isActive, sendingInputs, mappedOutputs };
  });

  const banks = outputBanks(scene.outputs);
  const activeBanks = banks
    .map((bank) => ({ ...bank, outputs: bank.outputs.filter(isMappedOutput) }))
    .filter((bank) => bank.outputs.length > 0);

  const signalTraces: SignalTrace[] = [];
  for (const input of inputs) {
    const directOutputs = scene.outputs.filter((output) => outputSourceMatchesInput(output, input.channel.number));
    if (directOutputs.length) {
      signalTraces.push({
        id: `ch-${input.channel.number}-direct`,
        input: input.channel,
        outputs: directOutputs,
        path: [`CH ${channelNumber(input.channel.number)} ${channelDisplayName(input.channel)}`, "Direct Out", ...directOutputs.map((output) => `${output.outputType} ${output.number}`)],
      });
    }

    for (const send of input.activeSends) {
      const bus = scene.buses.find((item) => item.number === send.bus);
      const outputs = scene.outputs.filter((output) => outputSourceMatchesBus(output, send.bus));
      signalTraces.push({
        id: `ch-${input.channel.number}-bus-${send.bus}`,
        input: input.channel,
        bus,
        send,
        outputs,
        path: [
          `CH ${channelNumber(input.channel.number)} ${channelDisplayName(input.channel)}`,
          `Bus ${channelNumber(send.bus)}${bus ? ` ${bus.name}` : ""}`,
          ...outputs.map((output) => `${output.outputType} ${output.number}`),
        ],
      });
    }
  }

  return {
    inputs,
    activeInputs: inputs.filter((input) => input.isActive),
    buses,
    activeBuses: buses.filter((bus) => bus.isActive),
    outputBanks: banks,
    activeOutputBanks: activeBanks,
    signalTraces,
    routingBlocks: scene.routingBlocks,
  };
}
