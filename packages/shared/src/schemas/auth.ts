import { z } from "zod";
import { userRoleSchema } from "./enums.js";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: userRoleSchema,
  image: z.string().nullable(),
});
export type UserResponse = z.infer<typeof userResponseSchema>;
