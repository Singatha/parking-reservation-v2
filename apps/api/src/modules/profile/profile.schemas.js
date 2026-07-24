import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(80),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100)
  }),
  params: z.object({}),
  query: z.object({})
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(10).max(128)
  }).refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must differ from the current password",
    path: ["newPassword"]
  }),
  params: z.object({}),
  query: z.object({})
});
