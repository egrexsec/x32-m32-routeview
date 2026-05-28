import type { MixerScene } from "@/types/routing";
import { bucketGroupForCategory, groupedParserCategories, parserBucketGroupLabels } from "@/lib/exporters";
import { Bug, CheckCircle2 } from "lucide-react";

export function ParserBucketsTab({ scene }: { scene: MixerScene }) {
  const groups = groupedParserCategories(scene, parserBucketGroupLabels);
  const totalLines = scene.unrecognizedCategories?.reduce((sum, category) => sum + category.count, 0) ?? 0;

  if (!groups.length) {
    return (
      <div className="panel flex items-center gap-2 p-4 text-sm">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span>No parser bucket categories were captured for this scene.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Parser Buckets</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Categorized scene lines that are captured for engineering review, future parser upgrades, and advanced exports.
            </p>
          </div>
          <div className="rounded-md border bg-background px-3 py-2 text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Captured Lines</div>
            <div className="font-mono text-xl font-semibold">{totalLines}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {groups.map((group) => {
          const groupTotal = group.categories.reduce((sum, category) => sum + category.count, 0);
          return (
            <section key={group.bucket} className="rounded-lg border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">{group.bucket}</h4>
                </div>
                <span className="rounded-full bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground">
                  {group.categories.length} categories · {groupTotal} lines
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-background/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Count</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-left">Examples</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.categories.map((category) => (
                      <tr key={category.category} className="border-b last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 font-medium">{category.category}</td>
                        <td className="px-4 py-3 font-mono">{category.count}</td>
                        <td className="min-w-[260px] px-4 py-3 text-muted-foreground">{category.description}</td>
                        <td className="min-w-[360px] px-4 py-3">
                          <pre className="max-h-32 overflow-auto rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed">
                            {category.examples.join("\n")}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      {(scene.unrecognizedCategories ?? []).some(
        (category) => !parserBucketGroupLabels.includes(bucketGroupForCategory(category.category)),
      ) ? (
        <p className="text-xs text-muted-foreground">Some categories were assigned to the fallback system bucket.</p>
      ) : null}
    </div>
  );
}
