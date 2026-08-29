#!/usr/bin/env node
/**
 * Record share.html dual-card stage → PNG frames → GIF + MP4.
 *
 * Usage (from this package root):
 *   npm install
 *   npx playwright install chromium
 *   node scripts/export-media.mjs
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EXPORT = join(ROOT, "export");
const FRAMES = join(EXPORT, "frames");
const FPS = 30;
const CYCLES = 2;
const DURATION_MS = 1200;
const TOTAL_FRAMES = Math.round((DURATION_MS / 1000) * FPS * CYCLES);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))
    );
  });
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const rel = urlPath === "/" ? "/share.html" : urlPath;
      const filePath = join(ROOT, rel.replace(/^\//, ""));
      if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const ext = extname(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(readFileSync(filePath));
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function main() {
  mkdirSync(EXPORT, { recursive: true });
  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });

  const { server, port } = await startStaticServer();
  // macOS 13 cannot install Playwright's bundled Chromium; use system Chrome.
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 780, height: 520 },
    deviceScaleFactor: 2,
  });

  await page.goto(`http://127.0.0.1:${port}/share.html`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => typeof window.__seekRipple === "function");

  // Stop live rAF so frames stay deterministic
  await page.evaluate(() => {
    window.__rippleHearts.forEach((h) => h.destroy());
  });

  const stage = page.locator("#stage");
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const progress = (i / (FPS * (DURATION_MS / 1000))) % 1;
    await page.evaluate((p) => window.__seekRipple(p), progress);
    const path = join(FRAMES, `frame_${String(i).padStart(4, "0")}.png`);
    await stage.screenshot({ path, type: "png" });
    if (i % 15 === 0) process.stdout.write(`frame ${i + 1}/${TOTAL_FRAMES}\n`);
  }

  await browser.close();
  server.close();

  const gifPath = join(EXPORT, "ripple-heart-thinking-red.gif");
  const mp4Path = join(EXPORT, "ripple-heart-thinking-red.mp4");
  const palette = join(EXPORT, "palette.png");

  await run("ffmpeg", [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    join(FRAMES, "frame_%04d.png"),
    "-vf",
    "palettegen=stats_mode=diff",
    "-frames:v",
    "1",
    "-update",
    "1",
    palette,
  ]);
  await run("ffmpeg", [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    join(FRAMES, "frame_%04d.png"),
    "-i",
    palette,
    "-lavfi",
    "paletteuse=dither=bayer:bayer_scale=3",
    "-loop",
    "0",
    gifPath,
  ]);
  await run("ffmpeg", [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    join(FRAMES, "frame_%04d.png"),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4Path,
  ]);

  console.log("\nWrote:");
  console.log(" ", gifPath);
  console.log(" ", mp4Path);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
