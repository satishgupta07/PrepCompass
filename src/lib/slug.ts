/**
 * Converts a display name (e.g. a Pattern's `name`) into a URL/DB-friendly
 * slug: lowercase, alphanumeric runs joined by single hyphens, with no
 * leading/trailing hyphen. Used as the upsert key in `scripts/seed.ts` and
 * for generating a Pattern's `slug` field, so the same input must always
 * produce the same output.
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // collapse any run of non-alphanumeric chars into one hyphen
    .replace(/^-+|-+$/g, ""); // drop hyphens left dangling at the start/end
}
