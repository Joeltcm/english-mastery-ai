import type { CatalogLesson } from "@/lib/lesson-catalog";

export type LessonProgress = CatalogLesson & { id?: string; attemptCount: number };

export function orderLessons(lessons: LessonProgress[], weakerFocus: "grammar" | "vocabulary") {
  const focusRank = (focus: CatalogLesson["focus"]) => focus === weakerFocus ? 0 : focus === "mixed" ? 1 : 2;
  return [...lessons].sort((left, right) => {
    const completionRank = Number(left.attemptCount > 0) - Number(right.attemptCount > 0);
    return completionRank || focusRank(left.focus) - focusRank(right.focus);
  });
}
