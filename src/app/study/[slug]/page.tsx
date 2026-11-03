// The "/study/[slug]" page: one notebook beside the signed-in user's
// per-page "studied" checklist. See StudyView for the interactive part. If
// MongoDB is unreachable the notebook and checklist still render, with
// progress disabled (see `tryGetStudiedPageIds`).
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { StudyView } from "@/components/study/StudyView";
import { tryGetStudiedPageIds } from "@/lib/services/study";
import { findNotebook } from "@/lib/study";
import { getNotebookPages } from "@/lib/study-pages";

// Progress depends on the session and the runtime MONGODB_URI.
export const dynamic = "force-dynamic";

export default async function StudyNotebookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const notebook = findNotebook(slug);
  if (!notebook) notFound();

  const session = await auth();
  if (!session?.user?.id) notFound(); // proxy.ts keeps signed-out visitors off this page already

  const [pages, studied] = await Promise.all([getNotebookPages(slug), tryGetStudiedPageIds(session.user.id, slug)]);

  return (
    <StudyView
      slug={slug}
      title={notebook.title}
      pages={pages}
      initialStudied={studied ?? []}
      progressUnavailable={studied === null}
    />
  );
}
