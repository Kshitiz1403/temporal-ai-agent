import { z } from "zod";

export const LoginClientSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(1),
  password: z.string({ required_error: "Password is required" }).min(1),
});

export type LoginClientDTO = z.infer<typeof LoginClientSchema>;
