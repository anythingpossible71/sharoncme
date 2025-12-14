"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logger } from "@/lib/logger";

const contactMessageSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  subject: z.string().max(200, "Subject is too long").optional(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message is too long"),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export async function submitContactMessage(data: ContactMessageInput) {
  try {
    // Validate input
    const validatedData = contactMessageSchema.parse(data);

    // Create contact message
    const message = await prisma.contactMessage.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject || null,
        message: validatedData.message,
      },
    });

    logger.info("Contact message submitted", { messageId: message.id, email: validatedData.email });

    revalidatePath("/contact");
    revalidatePath("/admin/contact-messages"); // For future admin page

    return { success: true, messageId: message.id };
  } catch (error) {
    logger.error(
      "Failed to submit contact message",
      {},
      error instanceof Error ? error : undefined
    );

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        errors: error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      };
    }

    return {
      success: false,
      error: "Failed to submit message. Please try again later.",
    };
  }
}

export async function getContactMessages() {
  try {
    const messages = await prisma.contactMessage.findMany({
      where: {
        deleted_at: null,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 100, // Limit to most recent 100 messages
    });

    return { success: true, messages };
  } catch (error) {
    logger.error("Failed to get contact messages", {}, error instanceof Error ? error : undefined);
    return {
      success: false,
      error: "Failed to retrieve messages",
      messages: [],
    };
  }
}

export async function deleteContactMessage(messageId: string) {
  try {
    // Soft delete the message
    await prisma.contactMessage.update({
      where: { id: messageId },
      data: { deleted_at: new Date() },
    });

    logger.info("Contact message deleted", { messageId });

    revalidatePath("/contact-us-inbox");

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to delete contact message",
      { messageId },
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: "Failed to delete message. Please try again later.",
    };
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    await prisma.contactMessage.update({
      where: { id: messageId },
      data: { read: true },
    });

    logger.info("Contact message marked as read", { messageId });

    revalidatePath("/contact-us-inbox");

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to mark message as read",
      { messageId },
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: "Failed to mark message as read. Please try again later.",
    };
  }
}
