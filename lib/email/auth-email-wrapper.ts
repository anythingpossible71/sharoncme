import { sendTemplatedEmail, type EmailTemplateOptions } from "crunchycone-lib";
import { getAppName } from "@/app/actions/app-settings";
import { logger } from "@/lib/logger";

interface EmailOptions {
  appName: string;
  supportEmail: string;
}

async function getEmailOptions(): Promise<EmailOptions> {
  // Try to get app name from database first, fallback to environment variables
  let appName: string;
  try {
    appName = await getAppName();
  } catch (error) {
    logger.warn("Failed to get app name from database, using environment variables", {
      error: error instanceof Error ? error.message : String(error),
    });
    appName =
      process.env.NEXT_PUBLIC_APP_NAME ||
      process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ||
      "CrunchyCone Starter";
  }

  return {
    appName,
    supportEmail:
      process.env.CRUNCHYCONE_EMAIL_FROM || process.env.EMAIL_FROM || "noreply@crunchycone.app",
  };
}

export async function sendMagicLinkEmail(email: string, signInUrl: string): Promise<void> {
  const options = await getEmailOptions();

  try {
    const emailOptions: EmailTemplateOptions = {
      template: "magic-link",
      to: email,
      from: process.env.CRUNCHYCONE_EMAIL_FROM || "noreply@crunchycone.app",
      language: "en",
      data: {
        signInUrl,
        ...options,
      },
    };

    await sendTemplatedEmail(emailOptions);
  } catch (error) {
    logger.error("Failed to send magic link email", {}, error instanceof Error ? error : undefined);
    throw new Error("Failed to send magic link email");
  }
}

export async function sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
  const options = await getEmailOptions();

  try {
    const emailOptions: EmailTemplateOptions = {
      template: "email-verification",
      to: email,
      from: process.env.CRUNCHYCONE_EMAIL_FROM || "noreply@crunchycone.app",
      language: "en",
      data: {
        verificationUrl,
        ...options,
      },
    };

    await sendTemplatedEmail(emailOptions);
  } catch (error) {
    logger.error(
      "Failed to send verification email",
      {},
      error instanceof Error ? error : undefined
    );
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const options = await getEmailOptions();

  try {
    const emailOptions: EmailTemplateOptions = {
      template: "password-reset",
      to: email,
      from: process.env.CRUNCHYCONE_EMAIL_FROM || "noreply@crunchycone.app",
      language: "en",
      data: {
        resetUrl,
        expiryHours: 1,
        ...options,
      },
    };

    await sendTemplatedEmail(emailOptions);
  } catch (error) {
    logger.error(
      "Failed to send password reset email",
      {},
      error instanceof Error ? error : undefined
    );
    throw new Error("Failed to send password reset email");
  }
}

export async function sendAdminPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const options = await getEmailOptions();

  try {
    const emailOptions: EmailTemplateOptions = {
      template: "admin-password-reset",
      to: email,
      from: process.env.CRUNCHYCONE_EMAIL_FROM || "noreply@crunchycone.app",
      language: "en",
      data: {
        resetUrl,
        expiryHours: 1,
        ...options,
      },
    };

    await sendTemplatedEmail(emailOptions);
  } catch (error) {
    logger.error(
      "Failed to send admin password reset email",
      {},
      error instanceof Error ? error : undefined
    );
    throw new Error("Failed to send admin password reset email");
  }
}

export async function sendWelcomeEmail(
  email: string,
  userName?: string,
  dashboardUrl?: string
): Promise<void> {
  const options = await getEmailOptions();

  try {
    const emailOptions: EmailTemplateOptions = {
      template: "welcome",
      to: email,
      from: process.env.CRUNCHYCONE_EMAIL_FROM || "noreply@crunchycone.app",
      language: "en",
      data: {
        userName,
        dashboardUrl:
          dashboardUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile`,
        ...options,
      },
    };

    await sendTemplatedEmail(emailOptions);
  } catch (error) {
    logger.error("Failed to send welcome email", {}, error instanceof Error ? error : undefined);
    throw new Error("Failed to send welcome email");
  }
}

// Auth.js compatible wrapper function
export async function sendAuthEmail(options: {
  identifier: string; // email
  url: string; // magic link URL
  provider: unknown; // Auth.js provider config
}) {
  await sendMagicLinkEmail(options.identifier, options.url);
}
