import type { MixerScene, OutputPatch, RoutingBlock } from "@/types/routing";
import {
  buildDerivedSceneModel,
  channelDisplayName,
  channelNumber,
  type DerivedSceneModel,
} from "@/lib/sceneModel";

export type TopologyNodeKind = "input" | "bus" | "output" | "routing-block";
export type TopologyEdgeKind = "send" | "direct-out" | "bus-out" | "routes-to";

export interface TopologyNode {
  id: string;
  kind: TopologyNodeKind;
  label: string;
  secondaryLabel?: string;
  searchableText: string;
  active: boolean;
}

export interface TopologyEdge {
  id: string;
  kind: TopologyEdgeKind;
  source: string;
  target: string;
  label?: string;
  searchableText: string;
}

export interface TopologyGraph {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface TopologySummary {
  activeInputCount: number;
  activeBusCount: number;
  mappedOutputCount: number;
  signalTraceCount: number;
  sendEdgeCount: number;
  busOutputEdgeCount: number;
  directOutputEdgeCount: number;
  routingBlockCount: number;
}

export interface TopologyGraphView {
  graph: TopologyGraph;
  inputs: TopologyNode[];
  buses: TopologyNode[];
  outputs: TopologyNode[];
  routingBlocks: TopologyNode[];
  edges: TopologyEdge[];
  summary: TopologySummary;
}

function outputNodeId(output: OutputPatch): string {
  return `output:${output.outputType.toLowerCase()}:${String(output.number).toLowerCase()}`;
}

function routingBlockNodeId(block: RoutingBlock): string {
  return `routing-block:${block.blockName.toLowerCase()}`;
}

function nodeMatchesQuery(node: TopologyNode, query: string): boolean {
  return !query || node.searchableText.includes(query);
}

function edgeMatchesVisibleNodes(edge: TopologyEdge, visibleNodeIds: Set<string>): boolean {
  return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
}

function buildGraph(scene: MixerScene, model: DerivedSceneModel): TopologyGraph {
  const nodes = new Map<string, TopologyNode>();
  const edges = new Map<string, TopologyEdge>();

  const addNode = (node: TopologyNode) => nodes.set(node.id, node);
  const addEdge = (edge: TopologyEdge) => edges.set(edge.id, edge);

  for (const input of model.inputs) {
    addNode({
      id: `input:${input.channel.number}`,
      kind: "input",
      label: `CH ${channelNumber(input.channel.number)}`,
      secondaryLabel: channelDisplayName(input.channel),
      searchableText: `ch ${channelNumber(input.channel.number)} ${channelDisplayName(input.channel)} ${input.channel.source ?? ""}`.toLowerCase(),
      active: input.isActive,
    });
  }

  for (const bus of model.buses) {
    addNode({
      id: `bus:${bus.bus.number}`,
      kind: "bus",
      label: `Bus ${channelNumber(bus.bus.number)}`,
      secondaryLabel: bus.bus.name,
      searchableText: `bus ${channelNumber(bus.bus.number)} ${bus.bus.name} ${bus.bus.type ?? ""}`.toLowerCase(),
      active: bus.isActive,
    });

    for (const output of bus.mappedOutputs) {
      addEdge({
        id: `edge:bus-out:${bus.bus.number}:${output.outputType}:${String(output.number)}`,
        kind: "bus-out",
        source: `bus:${bus.bus.number}`,
        target: outputNodeId(output),
        label: output.source,
        searchableText: `${bus.bus.name} ${output.outputType} ${output.number} ${output.source}`.toLowerCase(),
      });
    }
  }

  for (const output of scene.outputs) {
    const active = !!output.source && output.source !== "—" && output.source.toLowerCase() !== "off";
    addNode({
      id: outputNodeId(output),
      kind: "output",
      label: `${output.outputType} ${String(output.number).padStart(2, "0")}`,
      secondaryLabel: output.source,
      searchableText: `${output.outputType} ${output.number} ${output.source} ${output.notes ?? ""}`.toLowerCase(),
      active,
    });
  }

  for (const block of scene.routingBlocks) {
    addNode({
      id: routingBlockNodeId(block),
      kind: "routing-block",
      label: `${block.blockName} block`,
      secondaryLabel: block.assignments.join(" · "),
      searchableText: `${block.blockName} ${block.assignments.join(" ")}`.toLowerCase(),
      active: true,
    });
  }

  for (const input of model.inputs) {
    for (const send of input.activeSends) {
      addEdge({
        id: `edge:send:${input.channel.number}:${send.bus}`,
        kind: "send",
        source: `input:${input.channel.number}`,
        target: `bus:${send.bus}`,
        label: `${send.level}${send.tap ? ` · ${send.tap}` : ""}`,
        searchableText: `${channelDisplayName(input.channel)} bus ${send.bus} ${send.level} ${send.tap ?? ""}`.toLowerCase(),
      });
    }
  }

  for (const trace of model.signalTraces) {
    if (trace.bus) {
      for (const output of trace.outputs) {
        addEdge({
          id: `edge:bus-out:${trace.bus.number}:${output.outputType}:${String(output.number)}`,
          kind: "bus-out",
          source: `bus:${trace.bus.number}`,
          target: outputNodeId(output),
          label: output.source,
          searchableText: `${trace.bus.name} ${output.outputType} ${output.number} ${output.source}`.toLowerCase(),
        });
      }
      continue;
    }

    for (const output of trace.outputs) {
      addEdge({
        id: `edge:direct-out:${trace.input.number}:${output.outputType}:${String(output.number)}`,
        kind: "direct-out",
        source: `input:${trace.input.number}`,
        target: outputNodeId(output),
        label: output.source,
        searchableText: `${channelDisplayName(trace.input)} ${output.outputType} ${output.number} ${output.source}`.toLowerCase(),
      });
    }
  }

  const inputBlock = scene.routingBlocks.find((block) => block.blockName === "IN");
  if (inputBlock) {
    for (const input of model.inputs) {
      addEdge({
        id: `edge:routes-to:in:${input.channel.number}`,
        kind: "routes-to",
        source: routingBlockNodeId(inputBlock),
        target: `input:${input.channel.number}`,
        label: input.channel.source,
        searchableText: `in block ${channelDisplayName(input.channel)} ${input.channel.source ?? ""}`.toLowerCase(),
      });
    }
  }

  return { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()) };
}

function buildSummary(model: DerivedSceneModel, graph: TopologyGraph): TopologySummary {
  return {
    activeInputCount: model.activeInputs.length,
    activeBusCount: model.activeBuses.length,
    mappedOutputCount: model.activeOutputBanks.flatMap((bank) => bank.outputs).length,
    signalTraceCount: model.signalTraces.length,
    sendEdgeCount: graph.edges.filter((edge) => edge.kind === "send").length,
    busOutputEdgeCount: graph.edges.filter((edge) => edge.kind === "bus-out").length,
    directOutputEdgeCount: graph.edges.filter((edge) => edge.kind === "direct-out").length,
    routingBlockCount: model.routingBlocks.length,
  };
}

export function buildTopologyGraphView(
  scene: MixerScene,
  options?: { query?: string; activeOnly?: boolean },
): TopologyGraphView {
  const query = options?.query?.trim().toLowerCase() ?? "";
  const activeOnly = options?.activeOnly ?? true;
  const model = buildDerivedSceneModel(scene);
  const graph = buildGraph(scene, model);

  const eligibleNodes = graph.nodes.filter((node) => !activeOnly || node.active);
  const eligibleNodeIds = new Set(eligibleNodes.map((node) => node.id));

  let visibleNodeIds = new Set(eligibleNodeIds);
  let filteredEdges = graph.edges.filter((edge) => edgeMatchesVisibleNodes(edge, eligibleNodeIds));

  if (query) {
    const matchedNodeIds = new Set(eligibleNodes.filter((node) => nodeMatchesQuery(node, query)).map((node) => node.id));

    const contextualEdges = graph.edges.filter((edge) => {
      if (!eligibleNodeIds.has(edge.source) || !eligibleNodeIds.has(edge.target)) return false;
      return edge.searchableText.includes(query) || matchedNodeIds.has(edge.source) || matchedNodeIds.has(edge.target);
    });

    visibleNodeIds = new Set<string>();
    for (const edge of contextualEdges) {
      visibleNodeIds.add(edge.source);
      visibleNodeIds.add(edge.target);
    }
    for (const nodeId of matchedNodeIds) visibleNodeIds.add(nodeId);

    filteredEdges = contextualEdges.filter((edge) => edgeMatchesVisibleNodes(edge, visibleNodeIds));
  }

  const filteredNodes = eligibleNodes.filter((node) => visibleNodeIds.has(node.id));

  return {
    graph,
    inputs: filteredNodes.filter((node) => node.kind === "input"),
    buses: filteredNodes.filter((node) => node.kind === "bus"),
    outputs: filteredNodes.filter((node) => node.kind === "output"),
    routingBlocks: filteredNodes.filter((node) => node.kind === "routing-block"),
    edges: filteredEdges,
    summary: buildSummary(model, graph),
  };
}
