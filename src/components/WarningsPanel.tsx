import type { MixerScene } from "@/types/routing";
import { AlertTriangle, Bug, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";

export function WarningsPanel({ scene }: { scene: MixerScene }) {
  const [showLines, setShowLines] = useState(false);

  const uncategorizedCategories = useMemo(
    () =>
      (scene.unrecognizedCategories ?? []).filter(
        (category) => category.category === "Miscellaneous" || category.category === "Unknown",
      ),
    [scene.unrecognizedCategories],
  );

  const uncategorizedCount = uncategorizedCategories.reduce((sum, category) => sum + category.count, 0);
  const hasWarnings = scene.warnings.length > 0 || uncategorizedCount > 0;

  if (!hasWarnings) {
    return (
      <div className="panel flex items-center gap-2 p-3 text-sm">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span>Parser categorized all advanced scene data successfully.</span>
      </div>
    );
  }

  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h4 className="text-sm font-semibold">Uncategorized Parser Lines</h4>
      </div>

      {scene.warnings.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {scene.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-warning" />
              <span className="text-muted-foreground">{w}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {uncategorizedCount > 0 ? (
        <div className="mt-3 rounded-md border border-warning/30 bg-warning/5 p-3">
          <div className="flex items-start gap-2 text-sm">
            <Bug className="mt-0.5 h-4 w-4 text-warning" />
            <div>
              <p className="font-medium">
                {uncategorizedCount} uncategorized parser line{uncategorizedCount === 1 ? "" : "s"} detected.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                These lines did not match an existing parser bucket and may require future parser support.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLines((s) => !s)}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Bug className="h-3.5 w-3.5" />
            {showLines ? "Hide" : "Show"} uncategorized line samples
          </button>

          {showLines && (
            <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed">
              {uncategorizedCategories
                .flatMap((category) => category.examples)
                .slice(0, 100)
                .join("\n")}
            </pre>
          )}
        </div>
      ) : null}
    </div>
  );
}
