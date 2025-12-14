#!/usr/bin/env node

/**
 * Script to generate fake team member images and upload them to CrunchyCone storage
 * Then update the database with the uploaded URLs
 */

import { PrismaClient } from "@prisma/client";
import { initializeStorageProvider, getStorageProvider } from "crunchycone-lib/storage";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import https from "https";
import http from "http";

const prisma = new PrismaClient();

// Generate a simple colored square image as PNG buffer
function generateImageBuffer(color, size = 400) {
  // Create a simple SVG and convert to PNG-like data
  // For simplicity, we'll create a base64 PNG data URL
  // In a real scenario, you'd use a library like sharp or canvas

  // For now, we'll download placeholder images from a service
  // or create simple colored squares using a library

  // Using a simple approach: create a data URL for a colored square
  // This is a simplified version - in production you'd use proper image generation

  // For this script, we'll use a placeholder image service or create simple images
  // Let's use a simple approach with a colored square SVG converted to buffer

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${color}"/>
    <text x="50%" y="50%" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dominant-baseline="middle">${color.substring(1, 3)}</text>
  </svg>`;

  return Buffer.from(svg, "utf-8");
}

// Download image from URL and return buffer
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const chunks = [];

    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

// Generate fake team images using placeholder service
async function generateTeamImage(index) {
  // Use a placeholder image service that provides consistent faces
  // Using different seeds for variety
  const seeds = [1, 2, 3, 4];
  const url = `https://i.pravatar.cc/400?img=${seeds[index]}`;

  try {
    const buffer = await downloadImage(url);
    return buffer;
  } catch (error) {
    console.error(`Failed to download image ${index + 1}, using fallback:`, error.message);
    // Fallback: use a different placeholder service
    const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seeds[index]}`;
    try {
      return await downloadImage(fallbackUrl);
    } catch (fallbackError) {
      console.error(`Fallback also failed:`, fallbackError.message);
      // Last resort: create a simple colored square
      const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
      return generateImageBuffer(colors[index % colors.length]);
    }
  }
}

// Upload image to CrunchyCone storage
async function uploadImage(buffer, fileName, folder = "team") {
  try {
    // Initialize storage provider
    initializeStorageProvider();
    const provider = getStorageProvider();

    const uniqueId = uuidv4().slice(0, 8);
    const fileExtension = path.extname(fileName) || ".jpg";
    const baseFileName = path.basename(fileName, fileExtension);
    const finalFileName = `${baseFileName}-${uniqueId}${fileExtension}`;
    const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

    const uploadResult = await provider.uploadFile({
      external_id: `team-seed-${uniqueId}`,
      key: filePath,
      filename: finalFileName,
      buffer: buffer,
      contentType: "image/jpeg",
      size: buffer.length,
      public: true,
      metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "seed-script",
      },
    });

    // Return the URL - prefer publicUrl, fallback to API URL
    const url = uploadResult.publicUrl || `/api/storage/files/${uploadResult.key}`;

    console.log(`✅ Uploaded: ${filePath} -> ${url}`);
    return { url, key: uploadResult.key };
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error.message);
    throw error;
  }
}

// Update team member in database
async function updateTeamMemberAvatar(memberId, avatarUrl) {
  try {
    await prisma.teamMember.update({
      where: { id: memberId },
      data: { avatar_url: avatarUrl },
    });
    console.log(`✅ Updated team member ${memberId} with avatar URL`);
  } catch (error) {
    console.error(`❌ Failed to update team member ${memberId}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log("🚀 Starting team image seeding...\n");

    // Get all active team members
    const teamMembers = await prisma.teamMember.findMany({
      where: { deleted_at: null },
      orderBy: { order: "asc" },
    });

    if (teamMembers.length === 0) {
      console.log("⚠️  No team members found. Please seed team members first.");
      process.exit(1);
    }

    console.log(`Found ${teamMembers.length} team member(s)\n`);

    // Generate and upload images for up to 4 team members
    const membersToUpdate = teamMembers.slice(0, 4);

    for (let i = 0; i < membersToUpdate.length; i++) {
      const member = membersToUpdate[i];
      console.log(`📸 Generating image for ${member.name} (${i + 1}/${membersToUpdate.length})...`);

      try {
        // Generate image
        const imageBuffer = await generateTeamImage(i);

        // Upload to storage
        const fileName = `${member.name.toLowerCase().replace(/\s+/g, "-")}.jpg`;
        const { url } = await uploadImage(imageBuffer, fileName, "team");

        // Update database
        await updateTeamMemberAvatar(member.id, url);

        console.log(`✅ Completed: ${member.name}\n`);
      } catch (error) {
        console.error(`❌ Failed for ${member.name}:`, error.message);
        console.log("Continuing with next member...\n");
      }
    }

    console.log("🎉 Team image seeding completed!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
