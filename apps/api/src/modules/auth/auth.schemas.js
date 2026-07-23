import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().transform((value) => value.toLowerCase()),
    username: z.string().trim().min(3).max(80),
    password: z.string().min(10).max(128),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100)
  }),
  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().transform((value) => value.toLowerCase()),
    password: z.string().min(1)
  }),
  params: z.object({}),
  query: z.object({})
});
