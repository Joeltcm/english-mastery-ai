import { z } from "zod";

export const modeSchema = z.enum(["ASSISTANT", "TUTOR", "SMART"]);
export const chatRequestSchema = z.object({ conversationId: z.string().cuid().optional(), message: z.string().trim().min(1).max(6_000), mode: modeSchema });
export const registrationSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(160), password: z.string().min(10).max(128) });
