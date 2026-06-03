import { describe, expect, it } from "vitest";
import { demoScene } from "@/lib/demoScene";
import { buildTopologyGraphView } from "@/lib/topologyGraph";

describe("buildTopologyGraphView", () => {
  it("builds normalized nodes and edges from a parsed scene", () => {
    const topology = buildTopologyGraphView(demoScene, { activeOnly: false });

    expect(topology.graph.nodes.length).toBeGreaterThan(demoScene.inputs.length);
    expect(topology.graph.edges.some((edge) => edge.kind === "routes-to")).toBe(true);
    expect(topology.graph.edges.some((edge) => edge.kind === "bus-out")).toBe(true);
    expect(topology.summary.routingBlockCount).toBe(demoScene.routingBlocks.length);
  });

  it("supports filtering by engineering query", () => {
    const topology = buildTopologyGraphView(demoScene, {
      activeOnly: false,
      query: "broadcast",
    });

    expect(topology.outputs.some((node) => node.secondaryLabel?.toLowerCase().includes("broadcast"))).toBe(true);
    expect(topology.buses.some((node) => node.secondaryLabel?.toLowerCase().includes("broadcast"))).toBe(true);
    expect(topology.edges.length).toBeGreaterThan(0);
  });

  it("preserves connected routing context when a query matches one endpoint", () => {
    const topology = buildTopologyGraphView(demoScene, {
      query: "kick",
    });

    expect(topology.inputs.some((node) => node.secondaryLabel?.toLowerCase().includes("kick"))).toBe(true);
    expect(topology.buses.some((node) => node.label === "Bus 01")).toBe(true);
    expect(topology.edges.some((edge) => edge.kind === "send")).toBe(true);
  });
});
