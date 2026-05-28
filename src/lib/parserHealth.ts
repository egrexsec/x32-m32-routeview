import type { MixerScene, UnrecognizedCategory } from "@/types/routing";

export type ParserHealthStatus = "excellent" | "good" | "needs-attention";

export interface ParserCoverageHealth {
  status: ParserHealthStatus;
  totalRecognizedSections: number;
  advancedCategorizedLines: number;
  uncategorizedLines: number;
  totalCoverageUnits: number;
  recognizedPercent: number;
  categorizedPercent: number;
  unmatchedPercent: number;
  summaryRows: { label: string; value: number | string }[];
  unmatchedCategories: UnrecognizedCategory[];
  issueBody: string;
}

function countAdvancedCategories(scene: MixerScene): number {
  return (scene.unrecognizedCategories ?? [])
    .filter((category) => category.category !== "Miscellaneous" && category.category !== "Unknown")
    .reduce((sum, category) => sum + category.count, 0);
}

function countUncategorized(scene: MixerScene): number {
  return (scene.unrecognizedCategories ?? [])
    .filter((category) => category.category === "Miscellaneous" || category.category === "Unknown")
    .reduce((sum, category) => sum + category.count, 0);
}

function recognizedSectionCount(scene: MixerScene): number {
  return (
    scene.inputs.length +
    scene.buses.length +
    scene.dcas.length +
    scene.outputs.length +
    scene.routingBlocks.length +
    (scene.settings?.length ?? 0)
  );
}

function percent(part: number, total: number): number {
  if (!total) return 100;
  return Math.round((part / total) * 1000) / 10;
}

function statusFromUnmatched(unmatchedPercent: number): ParserHealthStatus {
  if (unmatchedPercent === 0) return "excellent";
  if (unmatchedPercent <= 5) return "good";
  return "needs-attention";
}

function issueBody(scene: MixerScene, unmatchedCategories: UnrecognizedCategory[], health: Omit<ParserCoverageHealth, "issueBody">): string {
  const examples = unmatchedCategories
    .flatMap((category) => category.examples.map((example) => `- [${category.category}] \`${example}\``))
    .join("\n");

  return [
    "## Parser Coverage Follow-up",
    "",
    `Scene file: ${scene.fileName ?? "Unknown"}`,
    `Parse status: ${scene.status}`,
    `Recognized sections: ${health.totalRecognizedSections}`,
    `Advanced categorized lines: ${health.advancedCategorizedLines}`,
    `Uncategorized lines: ${health.uncategorizedLines}`,
    `Unmatched coverage: ${health.unmatchedPercent}%`,
    "",
    "## Unmatched examples",
    "",
    examples || "No unmatched examples were captured.",
    "",
    "## Acceptance criteria",
    "",
    "- Add parser coverage for the unmatched line patterns above.",
    "- Move newly recognized patterns out of Miscellaneous/Unknown.",
    "- Keep scene parsing conservative and non-destructive.",
    "- Update parser tests or add fixture coverage for the new patterns.",
  ].join("\n");
}

export function buildParserCoverageHealth(scene: MixerScene): ParserCoverageHealth {
  const totalRecognizedSections = recognizedSectionCount(scene);
  const advancedCategorizedLines = countAdvancedCategories(scene);
  const uncategorizedLines = countUncategorized(scene);
  const totalCoverageUnits = totalRecognizedSections + advancedCategorizedLines + uncategorizedLines;
  const recognizedPercent = percent(totalRecognizedSections, totalCoverageUnits);
  const categorizedPercent = percent(totalRecognizedSections + advancedCategorizedLines, totalCoverageUnits);
  const unmatchedPercent = percent(uncategorizedLines, totalCoverageUnits);
  const unmatchedCategories = (scene.unrecognizedCategories ?? []).filter(
    (category) => category.category === "Miscellaneous" || category.category === "Unknown",
  );

  const healthWithoutIssue = {
    status: statusFromUnmatched(unmatchedPercent),
    totalRecognizedSections,
    advancedCategorizedLines,
    uncategorizedLines,
    totalCoverageUnits,
    recognizedPercent,
    categorizedPercent,
    unmatchedPercent,
    summaryRows: [
      { label: "Input Channels", value: scene.inputs.length },
      { label: "Mix Buses", value: scene.buses.length },
      { label: "DCA Groups", value: scene.dcas.length },
      { label: "Outputs", value: scene.outputs.length },
      { label: "Routing Blocks", value: scene.routingBlocks.length },
      { label: "Advanced Categorized Lines", value: advancedCategorizedLines },
      { label: "Uncategorized Lines", value: uncategorizedLines },
    ],
    unmatchedCategories,
  };

  return {
    ...healthWithoutIssue,
    issueBody: issueBody(scene, unmatchedCategories, healthWithoutIssue),
  };
}
