import { DIFFICULTY_META, type Difficulty } from "@/lib/difficulty";

// Maps each difficulty level to its Tailwind color token (defined in
// globals.css under @theme inline) so the badge text is color-coded.
const TONE_CLASSES: Record<Difficulty, string> = {
  easy: "text-easy",
  medium: "text-medium",
  hard: "text-hard",
};

/** Small colored label showing a problem's difficulty (Easy/Medium/Hard). */
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const meta = DIFFICULTY_META[difficulty];
  return (
    <span className={`text-sm font-medium ${TONE_CLASSES[difficulty]}`}>
      {meta.label}
    </span>
  );
}
