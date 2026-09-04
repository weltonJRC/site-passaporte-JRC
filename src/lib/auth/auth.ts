import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "../db/prisma";
import { sendEmailOtp } from "../email/sender";
import { normalizeEmail, getSecret } from "../security/crypto";

export const auth = betterAuth({
  secret: getSecret("BETTER_AUTH_SECRET", "default_better_auth_secret_must_be_32_chars_long"),
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "PARTICIPANT",
        input: false,
      },
      status: {
        type: "string",
        defaultValue: "PENDING",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Bloqueio rigoroso de cadastro sem convite:
          // Nenhum usuário pode ser criado a menos que possua registro de convite válido
          const normalized = normalizeEmail(user.email);
          const hasInvite = await prisma.pendingRegistration.findFirst({
            where: {
              normalizedEmail: normalized,
              status: { in: ["PENDING_OTP", "OTP_VERIFIED"] },
            },
          });

          // Permite bootstrap de admin inicial
          const isBootstrapEmail =
            process.env.BOOTSTRAP_ADMIN_EMAIL &&
            normalized === normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL);

          if (!hasInvite && !isBootstrapEmail) {
            throw new Error("Cadastro permitido exclusivamente mediante convite válido.");
          }
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutos
      sendVerificationOTP: async ({ email, otp, type }) => {
        const otpType = type === "sign-in" ? "LOGIN" : "INVITATION_ACTIVATION";
        await sendEmailOtp({ email, otp, type: otpType });
      },
    }),
  ],
});
