import { z } from "zod";

export const CreateUserSchema = z.object({
  customerId: z.string({ required_error: "Customer ID is required" }).min(1),
  phoneNumber: z.string({ required_error: "Phone Number is required" }).min(12),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
