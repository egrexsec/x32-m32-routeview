import { describe, expect, it } from "vitest";
import { buildDerivedSceneModel } from "@/lib/sceneModel";
import type { MixerScene } from "@/types/routing";

describe("buildDerivedSceneModel", () => {
  it("does not map outputs to buses by bus name alone", () => {
    const scene: MixerScene = {
      mixerType: "X32/M32",
      fileName: "collision.scn",
      fileSize: 128,
      parsedAt: new Date().toISOString(),
      status: "Parsed",
      inputs: [],
      buses: [{ number: 1, name: "Main L", type: "Mix Bus" }],
      dcas: [],
      outputs: [{ outputType: "XLR", number: 1, source: "Main L" }],
      routingBlocks: [],
      warnings: [],
      unrecognizedLines: [],
    };

    const model = buildDerivedSceneModel(scene);

    expect(model.buses[0].mappedOutputs).toEqual([]);
    expect(model.signalTraces).toEqual([]);
  });
});
