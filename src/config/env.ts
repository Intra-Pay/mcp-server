import dotenv from 'dotenv';
import { z } from 'zod';
import { parseArgs } from 'node:util';

dotenv.config();

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'client-key': { type: 'string' },
    'client-secret': { type: 'string' },
    'base-url': { type: 'string' },
    'environment': { type: 'string' },
    'webhook-secret': { type: 'string' },
    'port': { type: 'string' },
  },
  strict: false,
});

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

// Merge CLI args with process.env
// CLI args take precedence over environment variables
const configSource = {
  ...process.env,
  INTRAPAY_CLIENT_KEY: values['client-key'] ?? process.env.INTRAPAY_CLIENT_KEY,
  INTRAPAY_CLIENT_SECRET: values['client-secret'] ?? process.env.INTRAPAY_CLIENT_SECRET,
  INTRAPAY_BASE_URL: values['base-url'] ?? process.env.INTRAPAY_BASE_URL,
  INTRAPAY_ENV: values['environment'] ?? process.env.INTRAPAY_ENV,
  INTRAPAY_WEBHOOK_SECRET: values['webhook-secret'] ?? process.env.INTRAPAY_WEBHOOK_SECRET,
  PORT: values['port'] ?? process.env.PORT,
};

const parsed = EnvSchema.safeParse(configSource);

if (!parsed.success) {
  throw new Error(
    JSON.stringify({
      ok: false,
      errorCode: 'CONFIG_ERROR',
      message: 'Variáveis de ambiente ou argumentos inválidos. Verifique se as credenciais foram passadas.',
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
