import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  INTRAPAY_BASE_URL: z.string().url(),
  INTRAPAY_CLIENT_KEY: z.string().min(1),
  INTRAPAY_CLIENT_SECRET: z.string().min(1),
  INTRAPAY_ENV: z.enum(['sandbox', 'production']),
  INTRAPAY_WEBHOOK_SECRET: z.string().optional(),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .default('4000'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    JSON.stringify({
      ok: false,
      errorCode: 'CONFIG_ERROR',
      message: 'Variáveis de ambiente inválidas',
      details: parsed.error.flatten(),
    })
  );
}

export const env = {
  baseUrl: parsed.data.INTRAPAY_BASE_URL,
  clientKey: parsed.data.INTRAPAY_CLIENT_KEY,
  clientSecret: parsed.data.INTRAPAY_CLIENT_SECRET,
  environment: parsed.data.INTRAPAY_ENV,
  webhookSecret: parsed.data.INTRAPAY_WEBHOOK_SECRET,
  port: parseInt(parsed.data.PORT, 10),
};