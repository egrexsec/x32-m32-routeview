import { describe, expect, it } from "vitest";
import html from "../../index.html?raw";
import readme from "../../README.md?raw";
import launchReadiness from "../../docs/LAUNCH_READINESS.md?raw";
import productionRunbook from "../../docs/PRODUCTION_RUNBOOK.md?raw";

describe("public metadata", () => {
  it("uses correctly encoded title text", () => {
    expect(html).toContain("X32/M32 RouteView — Scene Routing Documentation");
    expect(html).not.toContain("â€”");
  });

  it("uses the currently working deployment as canonical", () => {
    expect(html).toContain('<link rel="canonical" href="https://x32-m32-routeview.vercel.app/" />');
    expect(html).toContain('<meta property="og:url" content="https://x32-m32-routeview.vercel.app/" />');
    expect(readme).toContain("Production target: <https://x32-m32-routeview.vercel.app>");
    expect(launchReadiness).toContain("Target: <https://x32-m32-routeview.vercel.app>");
    expect(productionRunbook).toContain("Verify `x32-m32-routeview.vercel.app`");
  });
});
