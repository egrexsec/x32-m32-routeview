import type { MixerScene, UnrecognizedCategory } from "@/types/routing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groupedParserCategories, parserBucketGroupLabels, type ParserBucketGroup } from "@/lib/exporters";
import { Bug, CheckCircle2 } from "lucide-react";

function bucketTabValue(bucket: ParserBucketGroup): string {
  return bucket.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function CategoryTable({ categories }: { categories: UnrecognizedCategory[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
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
          {categories.map((category) => (
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
  );
}

export function ParserBucketsTab({ scene }: { scene: MixerScene }) {
  const groups = groupedParserCategories(scene, parserBucketGroupLabels);
  const totalLines = scene.unrecognizedCategories?.reduce((sum, category) => sum + category.count, 0) ?? 0;
  const firstTab = groups.length ? bucketTabValue(groups[0].bucket) : "none";

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
              Categorized scene lines for engineering review, future parser upgrades, and advanced exports.
            </p>
          </div>
          <div className="rounded-md border bg-background px-3 py-2 text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Captured Lines</div>
            <div className="font-mono text-xl font-semibold">{totalLines}</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={firstTab} className="w-full">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {groups.map((group) => {
            const groupTotal = group.categories.reduce((sum, category) => sum + category.count, 0);
            return (
              <TabsTrigger key={group.bucket} value={bucketTabValue(group.bucket)} className="gap-2">
                {group.bucket}
                <span className="rounded-full bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {groupTotal}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {groups.map((group) => {
          const groupTotal = group.categories.reduce((sum, category) => sum + category.count, 0);
          return (
            <TabsContent key={group.bucket} value={bucketTabValue(group.bucket)} className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">{group.bucket}</h4>
                </div>
                <span className="rounded-full bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground">
                  {group.categories.length} categories · {groupTotal} lines
                </span>
              </div>
              <CategoryTable categories={group.categories} />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
