#!/usr/bin/env node

/**
 * Script to generate and upload team member images to CrunchyCone storage
 * Uses UI Avatars service to generate avatars from names
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const teamMembers = [
  { name: "Alex Johnson", id: "alex-johnson" },
  { name: "Sarah Chen", id: "sarah-chen" },
  { name: "Marcus Rodriguez", id: "marcus-rodriguez" },
  { name: "Emily Watson", id: "emily-watson" },
];

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const UPLOAD_ENDPOINT = `${BASE_URL}/api/admin/media/upload`;

// Generate avatar URL using UI Avatars
function getAvatarUrl(name, size = 400) {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=random&color=fff&bold=true&font-size=0.5`;
}

// Download image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

// Upload to CrunchyCone storage
async function uploadImage(buffer, fileName, folder = "team") {
  const FormData = require("form-data");
  const formData = new FormData();

  formData.append("file", buffer, {
    filename: fileName,
    contentType: "image/png",
  });
  formData.append("visibility", "public");
  formData.append("folder", folder);

  // Note: This requires authentication. In a real scenario, you'd need to:
  // 1. Authenticate as admin
  // 2. Get session token
  // 3. Include it in the request

  // For now, we'll return a placeholder URL structure
  // The actual upload should be done through the admin UI or with proper auth
  return {
    url: `/api/storage/files/${folder}/${fileName}`,
    path: `${folder}/${fileName}`,
  };
}

async function main() {
  console.log("Generating team member images...\n");

  const results = [];

  for (const member of teamMembers) {
    try {
      console.log(`Generating avatar for ${member.name}...`);
      const avatarUrl = getAvatarUrl(member.name, 400);
      const imageBuffer = await downloadImage(avatarUrl);

      const fileName = `${member.id}.png`;
      const uploadResult = await uploadImage(imageBuffer, fileName, "team");

      results.push({
        name: member.name,
        id: member.id,
        url: uploadResult.url,
        path: uploadResult.path,
      });

      console.log(`✅ Generated: ${member.name} -> ${uploadResult.url}\n`);
    } catch (error) {
      console.error(`❌ Error processing ${member.name}:`, error.message);
    }
  }

  console.log("\n📋 Results:");
  console.log(JSON.stringify(results, null, 2));

  console.log("\n⚠️  Note: Actual upload requires admin authentication.");
  console.log("Please upload these images manually through the admin media manager,");
  console.log("or use the generated URLs from UI Avatars directly.");
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getAvatarUrl, downloadImage };
