import { z } from "zod";

export const CreateWhatsappConfigSchema = z.object({
  accessToken: z.string({ required_error: "Access Token is required" }).min(1),
  phoneId: z.string({ required_error: "Phone ID is required" }).min(1),
  accountId: z.string({ required_error: "Account ID is required" }).min(1),
  verifyToken: z.string({ required_error: "Verify Token is required" }).min(1),
  webhookUrl: z.string({ required_error: "Webhook URL is required" }).min(1),

  appId: z.string({ required_error: "App ID is required" }).min(1),
  appSecret: z.string({ required_error: "App Secret is required" }).min(1),

  flows: z
    .object({
      webhookURL: z
        .string({ required_error: "Webhook URL is required" })
        .min(1),
      publicKey: z.string({ required_error: "Public Key is required" }).min(1),
      privateKey: z
        .string({ required_error: "Private Key is required" })
        .min(1),
      passphrase: z.string({ required_error: "Passphrase is required" }).min(1),
    })
    .optional(),
});

export type CreateWhatsappConfigDTO = z.infer<
  typeof CreateWhatsappConfigSchema
>;
