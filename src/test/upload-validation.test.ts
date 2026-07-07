import { describe, expect, it } from "vitest";
import { formatBytes, MAX_SCENE_BYTES, validateSceneFile } from "@/lib/uploadValidation";

describe("validateSceneFile", () => {
  it("accepts a non-empty .scn file within the size limit", () => {
    expect(validateSceneFile({ name: "Sunday Service.scn", size: 2048 })).toBeNull();
  });

  it("rejects files that are not scene files", () => {
    expect(validateSceneFile({ name: "notes.txt", size: 2048 })).toContain(".scn scene file");
  });

  it("rejects empty scene files", () => {
    expect(validateSceneFile({ name: "empty.scn", size: 0 })).toContain("empty");
  });

  it("rejects oversized scene files", () => {
    expect(validateSceneFile({ name: "large.scn", size: MAX_SCENE_BYTES + 1 })).toContain("10.00 MB or smaller");
  });
});

describe("formatBytes", () => {
  it("formats byte counts for user-facing limits", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
  });
});
