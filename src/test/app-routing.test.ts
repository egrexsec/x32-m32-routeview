import { describe, expect, it } from "vitest";
import { resolveRoute } from "@/lib/app-routing";
import packageJson from "../../package.json";

describe("app routing dependency policy", () => {
  it("resolves the landing page and unknown paths without a vulnerable router dependency", () => {
    expect(resolveRoute("/")).toBe("index");
    expect(resolveRoute("/missing")).toBe("not-found");
    expect(packageJson.dependencies).not.toHaveProperty("react-router-dom");
  });
});
