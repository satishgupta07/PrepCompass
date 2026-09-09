/**
 * Zod schemas shared by both transports (Server Actions and REST routes)
 * that write to MongoDB. Per the service-layer split documented in
 * CLAUDE.md, `src/lib/services/*.ts` is the only place these run — actions
 * and API routes just hand off `FormData`/JSON to a service function, which
 * validates with these schemas before touching the DB.
 */
import { z } from "zod";
import { DIFFICULTIES } from "./difficulty";

/**
 * An optional link field (LeetCode/GitHub/YouTube/reference URLs). HTML
 * forms submit an empty string for a blank input rather than omitting the
 * field, and `FormData.get()` returns `null` (not `undefined`) for a field
 * that isn't in the DOM at all (e.g. ProblemEditPanel's link inputs, which
 * only render for an admin) — so this accepts `""`, `null`, and `undefined`
 * and normalizes all three to `undefined`; a real value must still pass
 * `.url()`.
 */
const optionalUrl = z
  .string()
  .trim()
  .url()
  .nullable()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value === "" || value == null ? undefined : value));

export const PatternCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  referenceLink: optionalUrl,
});

/** Backs `registerAction`/`loginAction` (src/actions/auth.ts). */
export const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ProblemCreateSchema = z.object({
  pattern: z.string().trim().min(1, "Pattern is required"),
  title: z.string().trim().min(1, "Title is required").max(200),
  difficulty: z.enum(DIFFICULTIES),
  leetcodeLink: optionalUrl,
  githubLink: optionalUrl,
  youtubeLink: optionalUrl,
});

/**
 * Backs `updateProblemDetailsForm`, the full-replace edit-panel submission
 * (see CLAUDE.md: every field is always present in the form, so an
 * empty/absent link here means "clear it"). Not used by the partial-PATCH
 * path — that's validated separately in the problems service.
 */
export const ProblemDetailsUpdateSchema = z.object({
  // Unlike optionalUrl, a missing/blank notes field means "no notes" (""), not "leave untouched" —
  // this schema is only ever used for full-replace submits.
  notes: z
    .string()
    .max(10_000)
    .optional()
    .transform((value) => value ?? ""),
  lastRevisedDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  leetcodeLink: optionalUrl,
  githubLink: optionalUrl,
  youtubeLink: optionalUrl,
});
