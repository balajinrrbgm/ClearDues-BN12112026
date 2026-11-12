import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const tools = join(tmpdir(), "cleardues-video-tools", "node_modules");
const { chromium } = require(join(tools, "playwright-core"));
const ffmpeg = join(tools, "ffmpeg-static", "ffmpeg.exe");
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const output = resolve("docs/video/ClearDues-demo.mp4");
if (existsSync(output)) throw new Error("Output already exists; choose a different filename before recording again.");
if (!existsSync(ffmpeg) || !existsSync(edge)) throw new Error("The local FFmpeg and Edge recording tools are required.");

const temp = await mkdtemp(join(tmpdir(), "cleardues-demo-"));
const narration = await readFile(resolve("docs/video/NARRATION.md"), "utf8");
const timed = narration.split("## Timed narration")[1]?.split("**Estimated total:")[0];
const passages = timed?.split(/^### .+$/m).slice(1).map((text) => text.trim().replaceAll("`", "").replace("₹7.34 lakh crore", "seven point three four lakh crore rupees")) ?? [];
if (passages.length !== 5) throw new Error("Expected five timed narration sections.");

const wavs = [];
for (let index = 0; index < passages.length; index += 1) {
  const textFile = join(temp, `narration-${index}.txt`);
  const outputFile = join(temp, `narration-${index}.wav`);
  await writeFile(textFile, passages[index], "utf8");
  const speech = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", resolve("scripts/narrate-demo.ps1"), "-TextFile", textFile, "-OutputFile", outputFile], { encoding: "utf8" });
  if (speech.status !== 0 || !existsSync(outputFile)) throw new Error("Narration synthesis failed.");
  wavs.push(outputFile);
}
console.log("Synthesized five narration sections using a local Windows voice.");

const browser = await chromium.launch({ executablePath: edge, headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, recordVideo: { dir: temp, size: { width: 1920, height: 1080 } }, acceptDownloads: true });
const page = await context.newPage();
const recording = page.video();
page.on("dialog", (dialog) => dialog.accept());
const shots = [];
async function screenshot(name) {
  const file = join(temp, `${name}.png`);
  await page.screenshot({ path: file, animations: "disabled" });
  shots.push(file);
}

try {
  await page.goto("http://127.0.0.1:3012/", { waitUntil: "networkidle" });
  await page.getByText("Invoice review", { exact: true }).first().waitFor();
  await screenshot("01-case");

  await page.goto(pathToFileURL(resolve("docs/presentation/index.html")).href);
  await page.getByRole("button", { name: "Next slide" }).click();
  await page.getByText("The problem", { exact: true }).waitFor();
  await screenshot("02-problem");

  await page.goto("http://127.0.0.1:3012/", { waitUntil: "networkidle" });
  const excerpt = `Synthetic demo: delivery was completed and the finance team is reviewing the invoice. ${Date.now()}`;
  await page.getByLabel("Add correspondence excerpt").pressSequentially(excerpt, { delay: 20 });
  await page.getByRole("button", { name: "Add to record" }).click();
  await page.getByText(excerpt, { exact: false }).waitFor();
  await page.getByRole("button", { name: "Review evidence" }).click();
  await page.getByText("AI SELECTED · EXACT QUOTES VERIFIED").waitFor({ timeout: 60000 });
  if (await page.locator(".claim").count() < 1) throw new Error("The live model returned no verified quotations; no video was rendered.");
  await screenshot("03-foundry");

  await page.getByRole("button", { name: "Create Sandbox draft" }).click();
  await page.locator(".paypal-result code").waitFor({ timeout: 30000 });
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/paypal/invoices/") && response.request().method() === "GET" && response.status() === 200),
    page.getByRole("button", { name: "Refresh", exact: true }).click(),
  ]);
  await page.getByText("DRAFT", { exact: true }).waitFor({ timeout: 30000 });
  await screenshot("04-paypal");

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Evidence packet" }).click();
  if (!(await download).suggestedFilename().endsWith(".pdf")) throw new Error("Evidence PDF download failed.");
  await screenshot("05-complete");
} finally {
  await context.close();
  await browser.close();
}
if (!recording) throw new Error("Browser recording was not created.");
const recordedVideo = await recording.path();
console.log("Captured live Foundry review, Sandbox draft and PDF export using synthetic data.");

const durations = [20, 25, 60, 40, 33];
function audioDuration(file) {
  const probe = spawnSync(ffmpeg, ["-hide_banner", "-i", file], { encoding: "utf8" });
  const match = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(probe.stderr);
  if (!match) throw new Error("Could not inspect narration audio duration.");
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

const inputs = [shots[0], shots[1], recordedVideo, shots[3], shots[4]];
const args = ["-hide_banner", "-y"];
for (let index = 0; index < inputs.length; index += 1) {
  if (index !== 2) args.push("-loop", "1", "-framerate", "24", "-t", String(durations[index]));
  args.push("-i", inputs[index]);
}
for (const wav of wavs) args.push("-i", wav);

const filters = [];
for (let index = 0; index < durations.length; index += 1) {
  const duration = durations[index];
  filters.push(`[${index}:v]scale=1920:1080,fps=24,setsar=1,tpad=stop_mode=clone:stop_duration=${duration},trim=duration=${duration},setpts=PTS-STARTPTS,format=yuv420p[v${index}]`);
  const rate = Math.max(1, audioDuration(wavs[index]) / (duration - 0.5));
  if (rate > 2) throw new Error(`Narration section ${index + 1} is too long to fit its scene.`);
  filters.push(`[${index + 5}:a]atempo=${rate.toFixed(3)},apad,atrim=duration=${duration},asetpts=PTS-STARTPTS[a${index}]`);
}
filters.push(`${durations.map((_, index) => `[v${index}][a${index}]`).join("")}concat=n=${durations.length}:v=1:a=1[outv][outa]`);
args.push("-filter_complex", filters.join(";"), "-map", "[outv]", "-map", "[outa]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-t", "178", output);
console.log("Rendering the 2:58 MP4. This may take a few minutes.");
const render = spawnSync(ffmpeg, args, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
if (render.status !== 0) throw new Error(`Video rendering failed: ${render.stderr.slice(-2500)}`);
console.log(`Created ${output}`);