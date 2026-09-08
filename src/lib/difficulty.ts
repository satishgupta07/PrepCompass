/** Canonical list of problem difficulties, also used as the Zod enum in validation.ts. */
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

/** A single difficulty value, derived from DIFFICULTIES so the two can never drift apart. */
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * The set of color tones the `Badge` UI component accepts. Currently
 * identical to `Difficulty`, but kept as a distinct type since a badge's
 * tone is a presentation concern (mapped to the `easy`/`medium`/`hard` CSS
 * variables in globals.css) and isn't guaranteed to always mirror the
 * difficulty domain 1:1.
 */
export type BadgeTone = "easy" | "medium" | "hard";

/** Display label and badge color for each difficulty, keyed for O(1) lookup from a Problem's `difficulty`. */
export const DIFFICULTY_META: Record<
    Difficulty,
    { label: string; tone: BadgeTone }
> = {
    easy: { label: "Easy", tone: "easy" },
    medium: { label: "Medium", tone: "medium" },
    hard: { label: "Hard", tone: "hard" },
};
