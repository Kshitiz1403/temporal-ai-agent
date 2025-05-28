import { z } from "zod";

export const AppointmentBookingSchema = z.object({
  userId: z.string({ required_error: "User ID is required" }).min(1),
});

export type AppointmentBookingDTO = z.infer<typeof AppointmentBookingSchema>;
