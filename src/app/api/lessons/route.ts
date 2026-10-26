import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { lessonCatalog, type CatalogLesson } from "@/lib/lesson-catalog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ lessons: lessonCatalog.map((lesson) => ({ ...lesson, attemptCount: 0, recommended: lesson.slug === lessonCatalog[0].slug })), databaseConfigured: false });
  if (!process.env.DATABASE_URL) return NextResponse.json({ lessons: lessonCatalog.map((lesson) => ({ ...lesson, attemptCount: 0, recommended: lesson.slug === lessonCatalog[0].slug })), databaseConfigured: false });
  const userId = session.user.id;
  const profile = await db.learningProfile.findUnique({ where: { userId }, select: { grammarScore: true, vocabularyScore: true } });
  await Promise.all(lessonCatalog.map((lesson) => db.lesson.upsert({ where: { slug: lesson.slug }, update: { title: lesson.title, description: lesson.description, type: lesson.type, level: lesson.level, estimatedMin: lesson.estimatedMin, content: { prompt: lesson.prompt, focus: lesson.focus } }, create: { slug: lesson.slug, title: lesson.title, description: lesson.description, type: lesson.type, level: lesson.level, estimatedMin: lesson.estimatedMin, content: { prompt: lesson.prompt, focus: lesson.focus } } })));
  const lessons = await Promise.all(lessonCatalog.map(async (lesson) => {
    const stored = await db.lesson.findUniqueOrThrow({ where: { slug: lesson.slug }, select: { id: true } });
    const attemptCount = await db.lessonAttempt.count({ where: { userId, lessonId: stored.id, completedAt: { not: null } } });
    return { ...lesson, id: stored.id, attemptCount };
  }));
  const weakerFocus = (profile?.grammarScore || 0) <= (profile?.vocabularyScore || 0) ? "grammar" : "vocabulary";
  const focusRank = (focus: CatalogLesson["focus"]) => focus === weakerFocus ? 0 : focus === "mixed" ? 1 : 2;
  const orderedLessons = [...lessons].sort((left, right) => {
    const completionRank = Number(left.attemptCount > 0) - Number(right.attemptCount > 0);
    return completionRank || focusRank(left.focus) - focusRank(right.focus) || lessonCatalog.findIndex((lesson) => lesson.slug === left.slug) - lessonCatalog.findIndex((lesson) => lesson.slug === right.slug);
  });
  const recommended = orderedLessons[0];
  return NextResponse.json({ lessons: orderedLessons.map((lesson) => ({ ...lesson, recommended: lesson.slug === recommended?.slug })), databaseConfigured: true });
}
