import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const video = join(root, "docs", "video", "ClearDues-demo.mp4");
const output = join(root, "docs", "presentation", "thumbnail.png");
const tools = join(tmpdir(), "cleardues-video-tools", "node_modules");
const ffmpeg = join(tools, "ffmpeg-static", "ffmpeg.exe");
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const frame = join(tmpdir(), "cleardues-thumbnail-overview.png");

if (existsSync(output)) throw new Error("Thumbnail already exists; choose a different output path.");
if (!existsSync(video) || !existsSync(ffmpeg) || !existsSync(edge)) throw new Error("The demo video, local FFmpeg, and Microsoft Edge are required.");

execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-ss", "00:00:08", "-i", video, "-frames:v", "1", frame]);
const screenshot = readFileSync(frame).toString("base64");
const require = createRequire(import.meta.url);
const { chromium } = require(join(tools, "playwright-core"));
const browser = await chromium.launch({ executablePath: edge, headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
* { box-sizing: border-box; }
html, body { margin: 0; width: 1800px; height: 1200px; overflow: hidden; }
body { background: #e9f0e9; color: #173c30; font-family: "Segoe UI", sans-serif; }
.poster { width: 1800px; height: 1200px; position: relative; overflow: hidden; background: #f3f6f1; }
.rail { position: absolute; inset: 0 auto 0 0; width: 30px; background: #174436; }
.top { position: absolute; left: 100px; right: 100px; top: 66px; display: flex; align-items: center; justify-content: space-between; }
.eyebrow { color: #527262; font-size: 19px; font-weight: 700; letter-spacing: 1.4px; }
.eyebrow::before { content: ""; display: inline-block; width: 12px; height: 12px; margin-right: 14px; background: #df7652; vertical-align: 2px; }
.edition { color: #74867a; font-size: 18px; font-weight: 600; }
h1 { position: absolute; left: 96px; top: 130px; margin: 0; color: #173c30; font-size: 142px; font-weight: 800; line-height: 1; letter-spacing: 0; }
h1 span { color: #dd7855; }
.sub { position: absolute; left: 103px; top: 297px; margin: 0; color: #42584a; font-size: 41px; font-weight: 600; line-height: 1.2; }
.stamp { position: absolute; right: 100px; top: 162px; width: 372px; border-left: 4px solid #d77b58; padding: 8px 0 8px 24px; }
.stamp strong { display: block; color: #254c3b; font-size: 25px; line-height: 1.4; }
.stamp small { display: block; margin-top: 6px; color: #788b7e; font-size: 19px; }
.screen { position: absolute; left: 100px; top: 412px; width: 1600px; height: 648px; overflow: hidden; background: #fff; border: 10px solid white; box-shadow: 0 24px 58px rgba(28, 62, 42, .16); }
.screen img { display: block; width: 1580px; height: auto; }
.footer { position: absolute; left: 103px; right: 100px; bottom: 60px; display: flex; align-items: center; justify-content: space-between; }
.workflow { color: #315846; font-size: 20px; font-weight: 800; letter-spacing: 1px; }
.workflow span { color: #dc7854; margin: 0 16px; }
.mode { color: #77877c; font-size: 18px; font-weight: 600; }
</style></head><body><main class="poster">
<div class="rail"></div>
<div class="top"><div class="eyebrow">PAYPAL AI HACKATHON</div><div class="edition">PROJECT DEMO / SYNTHETIC DATA</div></div>
<h1>ClearDues<span>.</span></h1>
<p class="sub">Evidence behind every invoice.</p>
<div class="stamp"><strong>Microsoft Foundry<br>PayPal Sandbox</strong><small>AI-assisted. Human reviewed.</small></div>
<div class="screen"><img alt="ClearDues invoice review workbench" src="data:image/png;base64,${screenshot}"></div>
<div class="footer"><div class="workflow">EVIDENCE <span>/</span> REVIEW <span>/</span> ACTION</div><div class="mode">A clearer next step.</div></div>
</main></body></html>`, { waitUntil: "load" });
  await page.screenshot({ path: output, type: "png", animations: "disabled" });
  console.log(`Created ${output} (1800 x 1200)`);
} finally {
  await browser.close();
}