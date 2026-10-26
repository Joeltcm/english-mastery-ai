import { z } from "zod";

export const modeSchema = z.enum(["ASSISTANT", "TUTOR", "SMART"]);
const imageDataSchema = z.string().trim().max(4_500_000).regex(/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=\s]+$/).optional();
export const chatRequestSchema = z.object({ conversationId: z.string().cuid().optional(), message: z.string().trim().max(6_000), imageData: imageDataSchema, mode: modeSchema, webResearch: z.boolean().optional().default(false), studyActivity: z.enum(["voice-conversation"]).optional(), timezone: z.string().trim().max(100).optional() }).superRefine((value, context) => {
  if (!value.message && !value.imageData) context.addIssue({ code: "custom", path: ["message"], message: "Add a message or an image." });
});
export const registrationSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(160), password: z.string().min(10).max(128) });
export const profileUpdateSchema = z.object({ dailyGoalMinutes: z.number().int().min(5).max(180).optional(), monthlyBudgetUsd: z.number().min(0).max(500).optional() }).refine((value) => value.dailyGoalMinutes !== undefined || value.monthlyBudgetUsd !== undefined);
