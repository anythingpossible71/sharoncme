#!/usr/bin/env node

/**
 * Restart development server script
 * - Detects current/latest port (from running process or saved state)
 * - Kills any process using that port
 * - Clears build cache
 * - Starts dev server fresh on the same port
 */

import { spawn, execSync } from "child_process";
import net from "net";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT_FILE = path.join(__dirname, "..", ".dev-port");

// Get port from command line, environment, saved file, or default
function getTargetPort() {
  // 1. Command line argument
  if (process.argv[2]) {
    return parseInt(process.argv[2]);
  }

  // 2. Environment variable
  if (process.env.PORT) {
    return parseInt(process.env.PORT);
  }

  // 3. Saved port from previous run
  if (fs.existsSync(PORT_FILE)) {
    try {
      const savedPort = parseInt(fs.readFileSync(PORT_FILE, "utf8").trim());
      if (savedPort && savedPort > 0) {
        return savedPort;
      }
    } catch (err) {
      // Ignore errors reading port file
    }
  }

  // 4. Try to detect from running Next.js process
  try {
    const processes = execSync(
      "lsof -ti:3000,3001,3002,3003,3004,3005,3006,3007,3008 2>/dev/null || true",
      {
        encoding: "utf8",
      }
    )
      .trim()
      .split("\n")
      .filter(Boolean);

    if (processes.length > 0) {
      // Check which port each process is using
      for (const pid of processes) {
        try {
          const portInfo = execSync(`lsof -Pan -p ${pid} -iTCP -sTCP:LISTEN 2>/dev/null || true`, {
            encoding: "utf8",
          });
          const portMatch = portInfo.match(/:(\d+)/);
          if (portMatch) {
            const port = parseInt(portMatch[1]);
            if (port >= 3000 && port <= 3008) {
              return port;
            }
          }
        } catch (err) {
          // Continue checking other processes
        }
      }
    }
  } catch (err) {
    // Fall back to default
  }

  // 5. Default port
  return 3000;
}

// Kill process on a specific port
function killProcessOnPort(port) {
  try {
    const pids = execSync(`lsof -ti:${port} 2>/dev/null || true`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);

    if (pids.length > 0) {
      console.log(`🔪 Killing process(es) on port ${port}...`);
      pids.forEach((pid) => {
        try {
          execSync(`kill -9 ${pid} 2>/dev/null || true`);
          console.log(`   ✓ Killed process ${pid}`);
        } catch (err) {
          // Process might already be dead
        }
      });
      // Wait a moment for processes to fully terminate
      return new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (err) {
    // No process found or error - that's okay
  }
  return Promise.resolve();
}

// Kill all Next.js dev processes
function killAllNextDev() {
  try {
    console.log(`🔪 Killing all Next.js dev processes...`);
    execSync(`pkill -f "next dev" 2>/dev/null || true`);
    // Wait a moment
    return new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (err) {
    return Promise.resolve();
  }
}

// Clear build cache
function clearCache() {
  console.log(`🧹 Clearing build cache...`);
  try {
    const cacheDirs = [".next", ".turbo"];
    cacheDirs.forEach((dir) => {
      const dirPath = path.join(__dirname, "..", dir);
      if (fs.existsSync(dirPath)) {
        execSync(`rm -rf "${dirPath}" 2>/dev/null || true`);
        console.log(`   ✓ Cleared ${dir}`);
      }
    });
  } catch (err) {
    console.warn(`   ⚠️  Warning: Could not clear all cache: ${err.message}`);
  }
}

// Check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Save port to file
function savePort(port) {
  try {
    fs.writeFileSync(PORT_FILE, port.toString(), "utf8");
  } catch (err) {
    // Ignore errors saving port
  }
}

// Start dev server
function startDevServer(port) {
  console.log(`🚀 Starting development server on port ${port}...`);
  savePort(port);

  const nextProcess = spawn("npx", ["next", "dev", "-p", port.toString()], {
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
    cwd: path.join(__dirname, ".."),
  });

  // Pipe output
  nextProcess.stdout.on("data", (data) => {
    process.stdout.write(data);
  });

  nextProcess.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  // Handle termination
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping development server and file watcher...");
    try {
      // Kill watcher processes
      execSync("pkill -f 'watch-admin-files.js' || true", { stdio: "pipe" });
    } catch (e) {
      // Ignore errors
    }
    nextProcess.kill("SIGINT");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    try {
      execSync("pkill -f 'watch-admin-files.js' || true", { stdio: "pipe" });
    } catch (e) {
      // Ignore errors
    }
    nextProcess.kill("SIGTERM");
    process.exit(0);
  });

  nextProcess.on("error", (err) => {
    console.error("❌ Failed to start Next.js:", err);
    process.exit(1);
  });

  nextProcess.on("exit", (code) => {
    // Kill watcher when dev server exits
    try {
      execSync("pkill -f 'watch-admin-files.js' || true", { stdio: "pipe" });
    } catch (e) {
      // Ignore errors
    }
    if (code !== 0 && code !== null) {
      console.error(`❌ Development server exited with code ${code}`);
    }
    process.exit(code || 0);
  });
}

// Main function
async function main() {
  const targetPort = getTargetPort();
  console.log(`📍 Target port: ${targetPort}`);

  // Kill all Next.js dev processes first (to be safe)
  await killAllNextDev();

  // Kill process on target port specifically
  await killProcessOnPort(targetPort);

  // Verify port is available
  const isAvailable = await checkPort(targetPort);
  if (!isAvailable) {
    console.warn(`⚠️  Port ${targetPort} is still in use. Trying to kill again...`);
    await killProcessOnPort(targetPort);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const stillInUse = !(await checkPort(targetPort));
    if (stillInUse) {
      console.error(`❌ Port ${targetPort} is still in use. Please free it manually.`);
      process.exit(1);
    }
  }

  // Clear cache
  clearCache();

  // Start file watcher in background
  console.log("🔍 Starting file watcher for critical admin files...");
  const watcherPath = path.join(__dirname, "watch-admin-files.js");
  const watcherProcess = spawn("node", [watcherPath], {
    detached: true,
    stdio: "pipe", // Use pipe to avoid cluttering output
  });
  watcherProcess.unref(); // Allow parent process to exit independently

  // Wait a moment for watcher to initialize
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Start dev server
  startDevServer(targetPort);
}

// Run
main().catch((err) => {
  console.error("❌ Failed to restart development server:", err);
  process.exit(1);
});
