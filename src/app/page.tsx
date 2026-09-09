// The main tracker page ("/"): the pattern-by-pattern list of LeetCode
// problems. Fetches patterns + problems (via the cached `loadAppData`, safe
// to also call from Header in the same request) and groups problems under
// their pattern for TrackerView.
import { auth } from "@/auth";
import { loadAppData } from "@/lib/load-data";
import { groupByPattern } from "@/lib/grouping";
import { StatsHeader } from "@/components/patterns/StatsHeader";
import { TrackerView } from "@/components/patterns/TrackerView";
import { AddPatternForm } from "@/components/patterns/AddPatternForm";

// Data depends on the runtime MONGODB_URI env var, so this page can't be
// statically generated at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const { patterns, problems } = await loadAppData();
  const groups = groupByPattern(patterns, problems);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">DSA Tracker</h1>
        {isAdmin && <AddPatternForm />}
      </div>
      <StatsHeader problems={problems} />
      <TrackerView groups={groups} isAdmin={isAdmin} />
    </div>
  );
}
