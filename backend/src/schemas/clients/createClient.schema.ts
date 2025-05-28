import { z } from "zod";

export const CreateClientSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(1),
  password: z.string({ required_error: "Password is required" }).min(5),
});

export type CreateClientDTO = z.infer<typeof CreateClientSchema>;
