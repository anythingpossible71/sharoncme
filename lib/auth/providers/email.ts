import Email from "next-auth/providers/email";
import { logger } from "@/lib/logger";

async function sendMagicLinkEmail(email: string, url: string, provider: { from: string }) {
  try {
    // Import crunchycone-lib services
    const { createEmailService, getEmailTemplateService } = await import("crunchycone-lib");

    // Set email provider to the configured provider temporarily for template rendering
    const originalProvider = process.env.CRUNCHYCONE_EMAIL_PROVIDER;
    process.env.CRUNCHYCONE_EMAIL_PROVIDER = "console";

    try {
      // Render the magic-link template
      const templateService = getEmailTemplateService();
      const templateData = {
        signInUrl: url,
        appName: process.env.NEXT_PUBLIC_APP_NAME || "Your App",
        supportEmail: process.env.CRUNCHYCONE_EMAIL_FROM || "support@example.com",
      };

      const rendered = await templateService.previewTemplate("magic-link", templateData, "en");

      // Restore original email provider
      if (originalProvider === undefined) {
        delete process.env.CRUNCHYCONE_EMAIL_PROVIDER;
      } else {
        process.env.CRUNCHYCONE_EMAIL_PROVIDER = originalProvider;
      }

      // Send the email using the actual email service
      const emailService = createEmailService();
      const result = await emailService.sendEmail({
        from: {
          email: provider.from,
          name: process.env.CRUNCHYCONE_EMAIL_FROM_DISPLAY || "Your App",
        },
        to: [
          {
            email: email,
            name: "User",
          },
        ],
        subject: rendered.subject || "Sign in to your account",
        htmlBody: rendered.html || "",
        textBody: rendered.text || "",
      });

      if (!result.success) {
        logger.error("Failed to send magic link email", {
          error: result.error,
        });
        throw new Error(result.error || "Failed to send magic link email");
      }

      logger.info("Magic link email sent successfully", { email });
    } finally {
      // Ensure email provider is restored even if template rendering fails
      if (originalProvider === undefined) {
        delete process.env.CRUNCHYCONE_EMAIL_PROVIDER;
      } else {
        process.env.CRUNCHYCONE_EMAIL_PROVIDER = originalProvider;
      }
    }
  } catch (error) {
    logger.error("Magic link email error", {}, error instanceof Error ? error : undefined);

    // Fallback logging for development
    logger.info(`Magic Link Email (Fallback - Check Email Configuration)
To: ${email}
From: ${provider.from}
Click the link below to sign in:
${url}
This link will expire in 24 hours.`);
  }
}

export function createEmailProvider() {
  const enableMagicLink = process.env.NEXT_PUBLIC_ENABLE_MAGIC_LINK;
  if (enableMagicLink !== "true" && enableMagicLink !== "1") {
    return null;
  }

  const fromAddress =
    process.env.CRUNCHYCONE_EMAIL_FROM || process.env.EMAIL_FROM || "noreply@crunchycone.app";

  return Email({
    // Auth.js v5 requires a server config even when using custom sendVerificationRequest.
    // This dummy config is never used - our custom function handles all email sending.
    server: { host: "localhost", port: 25, auth: { user: "", pass: "" } },
    from: fromAddress,
    // Custom email sending function using CrunchyCone email service and templates
    sendVerificationRequest: async ({ identifier: email, url }) => {
      await sendMagicLinkEmail(email, url, { from: fromAddress });
    },
  });
}
