import type { InputChannel, MixerScene, MixBus, OutputPatch } from "@/types/routing";
import {
  buildDerivedSceneModel,
  channelDisplayName,
  channelNumber,
  isDefaultOrUnusedInput,
} from "@/lib/sceneModel";

export interface GuideInput {
  channel: InputChannel;
  label: string;
  dcas: string[];
}

export interface GuideMonitorMix {
  bus: MixBus;
  label: string;
  purpose: string;
  mappedOutputs: OutputPatch[];
  sendingInputs: GuideInput[];
}

export interface GuideOutput {
  output: OutputPatch;
  label: string;
  purpose: string;
}

export interface GuideDca {
  number: number;
  name: string;
  assignedInputs: GuideInput[];
}

export interface GuideEffect {
  label: string;
  detail: string;
}

export interface VolunteerGuide {
  sceneName: string;
  generatedAt: string;
  counts: {
    inputs: number;
    activeInputs: number;
    monitorMixes: number;
    outputs: number;
    dcas: number;
    effects: number;
  };
  activeInputs: GuideInput[];
  monitorMixes: GuideMonitorMix[];
  mainOutputs: GuideOutput[];
  dcaGroups: GuideDca[];
  effects: GuideEffect[];
  quickReference: { label: string; value: string; note: string }[];
  volunteerTips: string[];
  troubleshooting: string[];
}

function hasWords(value: string | undefined, words: string[]): boolean {
  const normalized = (value ?? "").toLowerCase();
  return words.some((word) => normalized.includes(word));
}

function busPurpose(bus: MixBus): string {
  const text = `${bus.name} ${bus.type ?? ""}`;
  if (hasWords(text, ["iem", "ear", "monitor", "wedge", "foldback"])) {
    return "Personal or stage monitor mix. Changes here affect what musicians hear, not the main room mix.";
  }
  if (hasWords(text, ["stream", "broadcast", "online", "record", "rec"])) {
    return "Broadcast or recording mix. Changes here can affect livestream or archive audio.";
  }
  if (hasWords(text, ["fx", "reverb", "verb", "delay"])) {
    return "Effects send. Changes here adjust how much signal feeds the effect.";
  }
  return "Auxiliary mix. Confirm its use with the technical director before making service-day changes.";
}

function outputPurpose(output: OutputPatch): string {
  const text = `${output.outputType} ${output.source} ${output.notes ?? ""}`;
  if (hasWords(text, ["lr", "main", "l+r", "left", "right"])) return "Main room or primary speaker feed.";
  if (hasWords(text, ["stream", "broadcast", "record", "rec"])) return "Broadcast or recording destination.";
  if (hasWords(text, ["matrix", "mtx", "delay", "fill", "lobby", "overflow"])) return "Distributed speaker or room feed.";
  if (hasWords(text, ["bus", "monitor", "iem", "wedge"])) return "Monitor or auxiliary output.";
  return "Physical or digital output from the console.";
}

function effectDetail(label: string): string {
  if (hasWords(label, ["delay"])) return "Delay effect or timed ambience. Keep changes intentional during service.";
  if (hasWords(label, ["reverb", "verb"])) return "Reverb effect. Too much can make speech and vocals harder to understand.";
  return "Effect or external processing reference found in the scene.";
}

function channelGuide(channel: InputChannel): GuideInput {
  return {
    channel,
    label: channelDisplayName(channel),
    dcas: channel.dcaAssignments ?? [],
  };
}

export function buildVolunteerGuide(scene: MixerScene): VolunteerGuide {
  const derived = buildDerivedSceneModel(scene);
  const activeInputs = derived.activeInputs
    .map((item) => item.channel)
    .filter((channel) => channel.number >= 1 && channel.number <= 32)
    .filter((channel) => !isDefaultOrUnusedInput(channel))
    .map(channelGuide);

  const inputByNumber = new Map(activeInputs.map((input) => [input.channel.number, input]));
  const activeBuses = derived.activeBuses.filter(({ bus }) => !hasWords(`${bus.name} ${bus.type ?? ""}`, ["fx", "reverb", "verb", "delay"]));
  const monitorMixes = activeBuses.map(({ bus, mappedOutputs, sendingInputs }) => ({
    bus,
    label: `Bus ${channelNumber(bus.number)} - ${bus.name || "Unnamed mix"}`,
    purpose: busPurpose(bus),
    mappedOutputs,
    sendingInputs: sendingInputs.map(({ channel }) => inputByNumber.get(channel.number) ?? channelGuide(channel)).slice(0, 10),
  }));

  const mainOutputs = derived.activeOutputBanks
    .flatMap((bank) => bank.outputs)
    .map((output) => ({
      output,
      label: `${output.outputType} ${output.number}`,
      purpose: outputPurpose(output),
    }));

  const dcaGroups = Array.from({ length: 8 }, (_, index) => {
    const number = index + 1;
    const dca = scene.dcas.find((item) => item.number === number);
    return {
      number,
      name: dca?.name || `DCA ${number}`,
      assignedInputs: (dca?.assignedChannels ?? []).map((channelNumberValue) => inputByNumber.get(channelNumberValue)).filter(Boolean) as GuideInput[],
    };
  });

  const effectLabels = new Set<string>();
  for (const bus of scene.buses) {
    const label = `Bus ${channelNumber(bus.number)} - ${bus.name || bus.type || "Effect send"}`;
    if (hasWords(label, ["fx", "reverb", "verb", "delay"])) effectLabels.add(label);
  }
  for (const setting of scene.settings ?? []) {
    const label = `${setting.section}: ${setting.name} ${setting.value}`;
    if (hasWords(label, ["fx", "effect", "reverb", "verb", "delay"])) effectLabels.add(label);
  }
  for (const block of scene.routingBlocks) {
    const label = `${block.blockName}: ${block.assignments.join(", ")}`;
    if (hasWords(label, ["fx", "effect", "reverb", "verb", "delay"])) effectLabels.add(block.blockName);
  }
  const effects = Array.from(effectLabels).slice(0, 8).map((label) => ({ label, detail: effectDetail(label) }));

  const quickReference = [
    {
      label: "Main Room",
      value: mainOutputs.find((item) => hasWords(`${item.output.source} ${item.output.notes ?? ""}`, ["lr", "main"]))?.label ?? "Check Main LR",
      note: "Start here when the room has no audio.",
    },
    {
      label: "Monitor Mixes",
      value: `${monitorMixes.length} active`,
      note: "Use bus sends to adjust what musicians hear.",
    },
    {
      label: "DCA Groups",
      value: `${dcaGroups.filter((dca) => dca.assignedInputs.length).length} assigned`,
      note: "Use DCAs for fast group-level control.",
    },
    {
      label: "Scene Health",
      value: scene.warnings.length ? `${scene.warnings.length} warning${scene.warnings.length === 1 ? "" : "s"}` : "No warnings",
      note: scene.warnings.length ? "Review warnings before sharing." : "Ready to export for the team.",
    },
  ];

  const volunteerTips = [
    "Before rehearsal, confirm the scene name, main outputs, monitor mixes, and DCA groups with the person leading audio.",
    "Use DCAs for quick group changes. Avoid changing channel gain unless the technical director asks you to.",
    "Monitor bus changes affect the stage or ears. They usually do not change what the congregation hears.",
    "If a channel is missing from a monitor, check the channel send to that bus before changing the main fader.",
    "Save or export this guide before handing off to another volunteer.",
  ];

  if (monitorMixes.some((mix) => hasWords(`${mix.bus.name} ${mix.bus.type ?? ""}`, ["stream", "broadcast", "record", "rec"]))) {
    volunteerTips.push("A broadcast or recording mix appears to be present. Treat it as its own audience, not just a copy of the room.");
  }
  if (effects.length) {
    volunteerTips.push("Effects are present. Small changes can be noticeable on vocals, speech, and livestream audio.");
  }

  const troubleshooting = [
    "No sound in the room: confirm Main LR is active, check the assigned main outputs, then check the source channel mute and DCA.",
    "A musician cannot hear something: find their monitor bus and confirm the channel has an enabled send to that bus.",
    "A whole section is too loud or muted: check the related DCA before changing every channel.",
    "Livestream sounds different from the room: check the broadcast bus or matrix path if one is listed.",
  ];

  return {
    sceneName: scene.fileName ?? "Untitled Scene",
    generatedAt: new Date(scene.parsedAt).toLocaleString(),
    counts: {
      inputs: scene.inputs.length,
      activeInputs: activeInputs.length,
      monitorMixes: monitorMixes.length,
      outputs: mainOutputs.length,
      dcas: dcaGroups.filter((dca) => dca.assignedInputs.length).length,
      effects: effects.length,
    },
    activeInputs,
    monitorMixes,
    mainOutputs,
    dcaGroups,
    effects,
    quickReference,
    volunteerTips,
    troubleshooting,
  };
}

