import { z } from "zod";

export const modeSchema = z.enum(["ASSISTANT", "TUTOR", "SMART"]);
export const chatRequestSchema = z.object({ conversationId: z.string().cuid().optional(), message: z.string().trim().min(1).max(6_000), mode: modeSchema, webResearch: z.boolean().optional().default(false) });
export const registrationSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(160), password: z.string().min(10).max(128) });
export const profileUpdateSchema = z.object({ dailyGoalMinutes: z.number().int().min(5).max(180).optional(), monthlyBudgetUsd: z.number().min(0).max(500).optional() }).refine((value) => value.dailyGoalMinutes !== undefined || value.monthlyBudgetUsd !== undefined);
