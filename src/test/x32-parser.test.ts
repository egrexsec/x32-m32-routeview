import { describe, expect, it } from "vitest";
import { parseSceneText } from "@/parsers/x32M32Parser";

const sceneFixture = `# 4.06
/ch/01/config "Kick" 1 YE 33
/ch/01/grp %00000001 %00000000
/ch/01/preamp +0.0 ON OFF 24 66
/ch/01/mix/01 ON -12.0 +0 PRE 0
/ch/02/config "Vox" 1 CY 34
/ch/02/mix/13 ON -6.0 +0 POST 0
/ch/17/config "Spare Wireless" 1 GN 35
/bus/01/config "Wedge" 1 GN
/bus/13/config "Broadcast" 1 CY
/dca/1/config "Band" WH
/outputs/main/01 26 POST OFF
/outputs/aux/01 16 POST OFF
/config/routing/IN AN1-8 AN9-16 AES50A-1-8 AES50A-9-16
/config/routing/OUT MAIN AUX1-6
/config/userrout/in/01 AES50A1-8
`;

describe("parseSceneText", () => {
  it("parses core routing entities and categorizes advanced lines", () => {
    const scene = parseSceneText(sceneFixture, { fileName: "fixture.scn", fileSize: sceneFixture.length });

    expect(scene.status).toBe("Parsed");
    expect(scene.inputs).toHaveLength(3);
    expect(scene.buses).toHaveLength(2);
    expect(scene.dcas).toHaveLength(1);
    expect(scene.outputs).toHaveLength(2);
    expect(scene.routingBlocks).toHaveLength(2);

    expect(scene.inputs[0]).toMatchObject({
      number: 1,
      name: "Kick",
      source: "Local In 1",
      dcaAssignments: ["Band"],
    });

    expect(scene.inputs[0].processing?.preamp).toContain("48V ON");
    expect(scene.inputs[0].sends).toEqual([
      { bus: 1, enabled: true, level: "-12.0", pan: "+0", tap: "PRE-FADER" },
    ]);
    expect(scene.inputs[1].sends?.[0]).toMatchObject({ bus: 13, enabled: true, level: "-6.0", tap: "POST-FADER" });
    expect(scene.inputs[2]).toMatchObject({
      number: 17,
      name: "Spare Wireless",
      source: "AES50-A 1",
    });

    expect(scene.unrecognizedCategories?.map((category) => category.category)).toContain("User Routing");
    expect(scene.warnings).toEqual([]);
  });

  it("marks unsupported content clearly", () => {
    const scene = parseSceneText("hello world");

    expect(scene.status).toBe("Unsupported");
    expect(scene.warnings[0]).toContain("does not look like a Behringer X32");
  });
});
