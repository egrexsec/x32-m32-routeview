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

    expect(markdown).toContain("# Sunday Service.scn Volunteer Console Guide");
    expect(markdown).toContain("Sunday Service.scn");
    expect(markdown).toContain("## Professional Condensed Routing Chart");
    expect(markdown).toContain("### Inputs and Sends");
    expect(markdown).toContain("### Buses");
    expect(markdown).toContain("### DCAs");
    expect(markdown).toContain("## Input Channels");
    expect(markdown).toContain("## Volunteer Notes");
  });

  it("exports standalone html documentation", () => {
    const html = sceneToHtml(scene);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("RouteView Documentation");
    expect(html).toContain("Professional Condensed Routing Chart");
    expect(html).toContain("Sunday Service.scn");
  });

  it("exports structured json documentation", () => {
    const json = JSON.parse(sceneToJson(scene));

    expect(json.generatedBy).toBe("RouteView");
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

    expect(plainText).toContain("Volunteer Console Guide");
    expect(plainText).not.toContain("|");
  });
});
