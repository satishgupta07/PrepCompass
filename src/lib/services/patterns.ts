import "server-only";
import { connectToDatabase } from "@/lib/db";
import { PatternModel, toPatternDTO, type PatternDocument, type PatternDTO } from "@/models/Pattern";
import { ProblemModel } from "@/models/Problem";
import { PatternCreateSchema } from "@/lib/validation";
import { slugify } from "@/lib/slug";
import { isValidObjectId } from "@/lib/object-id";
import { serviceError, type ServiceResult } from "@/lib/api-response";

/**
 * DB logic shared by the Server Actions (src/actions/patterns.ts, used by
 * the UI) and the REST API (src/app/api/patterns/*, for external callers
 * like a browser extension or script). Each surface handles its own
 * transport concerns (FormData vs JSON, revalidatePath vs NextResponse);
 * this module only knows about validation and MongoDB.
 */

/** Lists all patterns in display order (ascending `order`), for the pattern list / picker UI. */
export async function listPatterns(): Promise<PatternDTO[]> {
  await connectToDatabase();
  const docs = await PatternModel.find().sort({ order: 1 }).lean<PatternDocument[]>();
  return docs.map(toPatternDTO);
}

/**
 * Creates a new pattern. Validation: `name` is required (1-100 chars,
 * trimmed) and must slugify to a non-empty slug (i.e. contain at least one
 * letter/number — e.g. "!!!" would slugify to "" and is rejected); the
 * derived slug must not collide with an existing pattern's slug. New
 * patterns are appended to the end of the display order by taking the
 * current highest `order` + 1.
 */
export async function createPatternService(input: unknown): Promise<ServiceResult<PatternDTO>> {
  const parsed = PatternCreateSchema.safeParse(input);
  if (!parsed.success) {
    return serviceError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { name, referenceLink } = parsed.data;
  const slug = slugify(name);
  if (!slug) {
    return serviceError("Name must contain at least one letter or number", 400);
  }

  await connectToDatabase();

  const existing = await PatternModel.findOne({ slug }).lean();
  if (existing) {
    return serviceError("A pattern with this name already exists", 409);
  }

  // Append after the current last pattern in display order.
  const highest = await PatternModel.findOne()
    .sort({ order: -1 })
    .lean<{ order: number } | null>();
  const order = (highest?.order ?? 0) + 1;

  const doc = await PatternModel.create({ name, slug, order, referenceLink });
  return { ok: true, data: toPatternDTO(doc.toObject() as PatternDocument) };
}

/**
 * Deletes a pattern by id, but only if no problem still references its
 * slug — otherwise those problems would be left pointing at a pattern that
 * no longer exists. Callers should reassign/delete those problems first.
 */
export async function deletePatternService(id: string): Promise<ServiceResult<null>> {
  if (!isValidObjectId(id)) {
    return serviceError("Invalid pattern id", 400);
  }

  await connectToDatabase();

  const pattern = await PatternModel.findById(id).lean<{ slug: string } | null>();
  if (!pattern) {
    return serviceError("Pattern not found", 404);
  }

  // Referential-integrity guard: Problem.pattern stores the slug, not this
  // ObjectId, so check by slug.
  const problemCount = await ProblemModel.countDocuments({ pattern: pattern.slug });
  if (problemCount > 0) {
    return serviceError(`Cannot delete — ${problemCount} problem(s) still use this pattern`, 409);
  }

  await PatternModel.deleteOne({ _id: id });
  return { ok: true, data: null };
}
