import { describe, expect, it } from "vitest";
import { combinedCSV, exportBaseName, sceneToHtml, sceneToJson, sceneToMarkdown, sceneToPlainText } from "@/lib/exporters";
import { demoScene } from "@/lib/demoScene";

const scene = {
  ...demoScene,
  fileName: "Sunday Service.scn",
  parsedAt: "2026-07-07T13:45:00.000Z",
};

describe("scene exporters", () => {
  it("creates a clean date-stamped export base name", () => {
    expect(exportBaseName(scene)).toBe("sunday-service-2026-07-07");
  });

  it("exports markdown documentation", () => {
    const markdown = sceneToMarkdown(scene);

    expect(markdown).toContain("# X32 / M32 RouteView");
    expect(markdown).toContain("Sunday Service.scn");
    expect(markdown).toContain("## 1. Input Channels");
  });

  it("exports standalone html documentation", () => {
    const html = sceneToHtml(scene);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("X32 / M32 RouteView Documentation");
    expect(html).toContain("Sunday Service.scn");
  });

  it("exports structured json documentation", () => {
    const json = JSON.parse(sceneToJson(scene));

    expect(json.generatedBy).toBe("X32/M32 RouteView");
    expect(json.scene.fileName).toBe("Sunday Service.scn");
    expect(json.scene.inputs.length).toBeGreaterThan(0);
  });

  it("exports a combined csv workbook-style document", () => {
    const csv = combinedCSV(scene);

    expect(csv).toContain("## INPUTS");
    expect(csv).toContain("## OUTPUTS");
    expect(csv).toContain("Sunday Service.scn");
  });

  it("exports plain text without markdown table pipes", () => {
    const plainText = sceneToPlainText(scene);

    expect(plainText).toContain("X32 / M32 RouteView");
    expect(plainText).not.toContain("|");
  });
});
