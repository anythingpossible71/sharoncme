import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentEmailSettings } from "@/app/actions/email-settings";
import { logger } from "@/lib/logger";

// Helper function to convert phone to WhatsApp international format
function toWhatsappInternational(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "972" + digits.slice(1);
  }
  return digits;
}

// Email template for contact form submissions
function renderContactFormEmail({
  name,
  phone,
  email,
  activityType,
  birthdate,
  babyBirthdate,
  message,
  howFound,
  referrerName,
}: {
  name?: string;
  phone?: string;
  email?: string;
  activityType?: string;
  birthdate?: string;
  babyBirthdate?: string;
  message?: string;
  howFound?: string;
  referrerName?: string;
}): string {
  const whatsappLink = phone ? `https://wa.me/${toWhatsappInternational(phone)}` : "";

  return `
    <div style="font-family: Rubik, Arial, sans-serif; font-size: 12px; color: #393939; direction: rtl; text-align: right; line-height: 1.7;">
      <div style="margin-bottom: 24px;">
        אהלן אהובה,<br />
        יש הרשמה חדשה באתר.<br />
        הנה הפרטים:
      </div>
      ${activityType ? `<div style="margin-bottom: 16px;"><strong>פעולות:</strong><br />${activityType}</div>` : ""}
      ${name ? `<div style="margin-bottom: 16px;"><strong>שם:</strong><br />${name}</div>` : ""}
      ${phone ? `<div style="margin-bottom: 16px;"><strong>טלפון:</strong><br />${phone} (<a href="${whatsappLink}" style="color: #1976d2; text-decoration: underline; font-weight: 700;">וואטסאפ</a>)</div>` : ""}
      ${email ? `<div style="margin-bottom: 16px;"><strong>אימייל:</strong><br />${email}</div>` : ""}
      ${birthdate ? `<div style="margin-bottom: 16px;"><strong>תאריך לידה:</strong><br />${birthdate}</div>` : ""}
      ${babyBirthdate ? `<div style="margin-bottom: 16px;"><strong>תאריך לידה של התינוק/ת:</strong><br />${babyBirthdate}</div>` : ""}
      ${message ? `<div style="margin-bottom: 16px;"><strong>הודעה:</strong><br />${message}</div>` : ""}
      ${howFound ? `<div style="margin-bottom: 16px;"><strong>איך שמעת עלינו:</strong><br />${howFound}</div>` : ""}
      ${referrerName ? `<div style="margin-bottom: 16px;"><strong>שם מפנה:</strong><br />${referrerName}</div>` : ""}
    </div>
  `;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
};

// Handle preflight OPTIONS request
export async function OPTIONS(req: Request) {
  // Get the origin from the request
  const origin = req.headers.get("origin");

  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      // Echo back the origin if provided, otherwise allow all
      "Access-Control-Allow-Origin": origin || "*",
    },
  });
}

export async function POST(req: Request) {
  // Get the origin from the request for CORS
  const origin = req.headers.get("origin");

  try {
    const data = await req.json();
    const {
      name,
      phone,
      email,
      activityType,
      birthdate,
      babyBirthdate,
      message,
      howFound,
      referrerName,
    } = data;

    // Validation: required fields
    if (!name || !phone || !activityType) {
      const origin = req.headers.get("origin");
      return NextResponse.json(
        {
          error: "Name, phone, and activity type are required.",
        },
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Access-Control-Allow-Origin": origin || "*",
          },
        }
      );
    }

    // Save to database
    const submission = await prisma.contactSubmission.create({
      data: {
        name,
        phone,
        email: email || null,
        activityType,
        birthdate: birthdate ? new Date(birthdate) : null,
        babyBirthdate: babyBirthdate ? new Date(babyBirthdate) : null,
        message: message || null,
        howFound: howFound || null,
        referrerName: referrerName || null,
      },
    });

    // Send notification email to Sharon
    const html = renderContactFormEmail({
      name,
      phone,
      email,
      activityType,
      birthdate,
      babyBirthdate,
      message,
      howFound,
      referrerName,
    });

    // Get current email settings from admin configuration
    const emailSettings = await getCurrentEmailSettings();

    // Ensure we use CrunchyCone mail provider for contact form notifications
    // Default to "crunchycone" if not explicitly set
    const emailProvider: "crunchycone" | "sendgrid" | "resend" | "aws-ses" | "smtp" | "mailgun" =
      (emailSettings.provider || "crunchycone") as
        | "crunchycone"
        | "sendgrid"
        | "resend"
        | "aws-ses"
        | "smtp"
        | "mailgun";

    // Log to both console and logger for visibility
    console.log("🚀 CONTACT FORM: Starting email send process", {
      provider: emailProvider,
      fromAddress: emailSettings.fromAddress,
      submissionName: name,
      submissionPhone: phone,
    });

    // Store original env vars for SMTP (same approach as test email)
    // Declare outside try block so it's accessible in catch/finally
    const originalEnvVars: Record<string, string | undefined> = {};
    try {
      // Ensure environment variables are set for the email service
      // The crunchycone-lib reads from process.env, so we need to set them
      if (!process.env.CRUNCHYCONE_EMAIL_PROVIDER) {
        process.env.CRUNCHYCONE_EMAIL_PROVIDER = emailProvider;
      }

      if (emailProvider === "smtp") {
        // Store original values
        originalEnvVars.CRUNCHYCONE_SMTP_HOST = process.env.CRUNCHYCONE_SMTP_HOST;
        originalEnvVars.CRUNCHYCONE_SMTP_PORT = process.env.CRUNCHYCONE_SMTP_PORT;
        originalEnvVars.CRUNCHYCONE_SMTP_USER = process.env.CRUNCHYCONE_SMTP_USER;
        originalEnvVars.CRUNCHYCONE_SMTP_PASS = process.env.CRUNCHYCONE_SMTP_PASS;
        originalEnvVars.CRUNCHYCONE_SMTP_FROM = process.env.CRUNCHYCONE_SMTP_FROM;
        originalEnvVars.CRUNCHYCONE_SMTP_SECURE = process.env.CRUNCHYCONE_SMTP_SECURE;

        // Set values from settings
        if (emailSettings.smtpHost) process.env.CRUNCHYCONE_SMTP_HOST = emailSettings.smtpHost;
        if (emailSettings.smtpPort) process.env.CRUNCHYCONE_SMTP_PORT = emailSettings.smtpPort;
        if (emailSettings.smtpUser) process.env.CRUNCHYCONE_SMTP_USER = emailSettings.smtpUser;
        if (emailSettings.smtpPassword)
          process.env.CRUNCHYCONE_SMTP_PASS = emailSettings.smtpPassword;
        if (emailSettings.fromAddress)
          process.env.CRUNCHYCONE_SMTP_FROM = emailSettings.fromAddress;
        process.env.CRUNCHYCONE_SMTP_SECURE = (emailSettings.smtpSecure || false).toString();

        // Clear the module cache for email factory to force re-reading env vars
        try {
          const { createRequire } = await import("module");
          const require = createRequire(import.meta.url);
          const factoryId = require.resolve("crunchycone-lib");
          delete require.cache[factoryId];
        } catch (error) {
          // If we can't clear the cache, continue anyway
          logger.warn("Could not clear crunchycone-lib cache:", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } else if (emailProvider === "crunchycone") {
        if (emailSettings.crunchyconeApiKey && !process.env.CRUNCHYCONE_API_KEY) {
          process.env.CRUNCHYCONE_API_KEY = emailSettings.crunchyconeApiKey;
        }
        if (emailSettings.crunchyconeApiUrl && !process.env.CRUNCHYCONE_API_URL) {
          process.env.CRUNCHYCONE_API_URL = emailSettings.crunchyconeApiUrl;
        }
        if (emailSettings.crunchyconeProjectId && !process.env.CRUNCHYCONE_PROJECT_ID) {
          process.env.CRUNCHYCONE_PROJECT_ID = emailSettings.crunchyconeProjectId;
        }
      }

      logger.info("🔧 Contact Form Email Settings", {
        provider: emailProvider,
        fromAddress: emailSettings.fromAddress,
        fromDisplayName: emailSettings.fromDisplayName,
        hasApiKey: !!(emailSettings.crunchyconeApiKey || process.env.CRUNCHYCONE_API_KEY),
        hasApiUrl: !!(emailSettings.crunchyconeApiUrl || process.env.CRUNCHYCONE_API_URL),
        hasProjectId: !!(emailSettings.crunchyconeProjectId || process.env.CRUNCHYCONE_PROJECT_ID),
      });

      // Use crunchycone-lib to send email via CrunchyCone mail service
      // Import after setting environment variables so it picks them up
      const { createEmailService } = await import("crunchycone-lib");
      // Use the same pattern as magic link email - call without params to use env vars
      const emailService = createEmailService();

      // Use configured from address, fallback to default
      const fromEmail = emailSettings.fromAddress || "noreply@crunchycone.app";
      const fromName = emailSettings.fromDisplayName || "Contact Form";

      // Get admin user's email address from database
      // Find the first admin user to send notifications to
      const adminUser = await prisma.user.findFirst({
        where: {
          deleted_at: null,
          roles: {
            some: {
              deleted_at: null,
              role: {
                name: "admin",
                deleted_at: null,
              },
            },
          },
        },
        select: {
          email: true,
        },
      });

      // Use admin user's email, or fallback to from address
      const adminEmail = adminUser?.email || fromEmail;

      if (!adminEmail) {
        logger.error("❌ No admin email found - cannot send notification");
        throw new Error("No admin email address configured");
      }

      logger.info("📧 Sending contact form notification email", {
        provider: emailProvider,
        from: { email: fromEmail, name: fromName },
        to: [{ email: adminEmail, name: "Admin" }],
        subject: "הרשמה חדשה באתר",
        submissionName: name,
        submissionPhone: phone,
        hasApiKey: !!(emailSettings.crunchyconeApiKey || process.env.CRUNCHYCONE_API_KEY),
        hasApiUrl: !!(emailSettings.crunchyconeApiUrl || process.env.CRUNCHYCONE_API_URL),
        hasProjectId: !!(emailSettings.crunchyconeProjectId || process.env.CRUNCHYCONE_PROJECT_ID),
      });

      const result = await emailService.sendEmail({
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: [
          {
            email: adminEmail,
            name: "Admin",
          },
        ],
        subject: "הרשמה חדשה באתר",
        htmlBody: html,
        textBody: `הרשמה חדשה באתר - ${name} - ${phone}`,
      });

      logger.info("📬 Email send result", {
        success: result.success,
        error: result.error,
        errorDetails: (result as any).errorDetails,
      });

      // Restore original env vars for SMTP
      if (emailProvider === "smtp") {
        for (const [key, value] of Object.entries(originalEnvVars)) {
          if (value === undefined) {
            delete (process.env as Record<string, string | undefined>)[key];
          } else {
            (process.env as Record<string, string | undefined>)[key] = value;
          }
        }
      }

      if (!result.success) {
        logger.error("❌ Failed to send contact form email", {
          error: result.error,
          errorDetails: (result as any).errorDetails || "No additional error details",
          provider: emailProvider,
          from: fromEmail,
          to: adminEmail,
          hasApiKey: !!(emailSettings.crunchyconeApiKey || process.env.CRUNCHYCONE_API_KEY),
          hasApiUrl: !!(emailSettings.crunchyconeApiUrl || process.env.CRUNCHYCONE_API_URL),
          hasProjectId: !!(
            emailSettings.crunchyconeProjectId || process.env.CRUNCHYCONE_PROJECT_ID
          ),
        });
      } else {
        logger.info(`✅ Contact form email sent successfully via ${emailProvider.toUpperCase()}`, {
          from: `${fromName} <${fromEmail}>`,
          to: adminEmail,
          subject: "הרשמה חדשה באתר",
          provider: emailProvider,
          submissionName: name,
          submissionPhone: phone,
        });
      }
    } catch (emailError) {
      // Restore original env vars on error too
      if (emailProvider === "smtp") {
        for (const [key, value] of Object.entries(originalEnvVars)) {
          if (value === undefined) {
            delete (process.env as Record<string, string | undefined>)[key];
          } else {
            (process.env as Record<string, string | undefined>)[key] = value;
          }
        }
      }

      logger.error(
        "❌ Exception while sending contact form email",
        {
          error: emailError instanceof Error ? emailError.message : String(emailError),
        },
        emailError instanceof Error ? emailError : undefined
      );
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        submission: {
          id: submission.id,
          name: submission.name,
          phone: submission.phone,
          activityType: submission.activityType,
          createdAt: submission.created_at,
        },
      },
      {
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Origin": origin || "*",
        },
      }
    );
  } catch (err) {
    logger.error("Contact form submission error:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to submit contact form.",
      },
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Origin": origin || "*",
        },
      }
    );
  }
}
