// Generates the original demo recipe videos in public/videos/ (title card + one slide per step).
// Requires ffmpeg with drawtext. Run once: npm run videos:demo
// Replace with licensed footage before launch, via Admin → Videos.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { RECIPES, DEMO_VIDEO_RECIPES } from "./seed-data";
import { slugify } from "../src/lib/utils";

const FONT = process.env.VIDEO_FONT || "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const FONT_BOLD = process.env.VIDEO_FONT_BOLD || "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const SLIDE_SECONDS = 4.5;
const OUT = path.resolve("public/videos");
const wrap = (t: string, n: number) => t.split(" ").reduce<string[]>((lines, w) => {
  const last = lines[lines.length - 1];
  if (last !== undefined && (last + " " + w).length <= n) lines[lines.length - 1] = last + " " + w; else lines.push(w);
  return lines;
}, []).join("\n");

fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vid-"));
for (const idx of DEMO_VIDEO_RECIPES) {
  const r = RECIPES[idx];
  const slides = [{ kicker: "SIMMERLY TEST KITCHEN", text: wrap(r.t, 26), big: true }, ...r.st.map((s, i) => ({ kicker: `STEP ${i + 1} OF ${r.st.length}`, text: wrap(s, 44), big: false }))];
  const parts: string[] = [];
  slides.forEach((s, i) => {
    const tf = path.join(tmp, `t${i}.txt`); const kf = path.join(tmp, `k${i}.txt`); fs.writeFileSync(tf, s.text); fs.writeFileSync(kf, s.kicker);
    const part = path.join(tmp, `p${i}.mp4`); parts.push(part);
    const vf = [
      "drawbox=x=0:y=0:w=iw:h=10:color=0xce4620:t=fill",
      `drawtext=fontfile=${FONT_BOLD}:textfile=${kf}:fontcolor=0xce4620:fontsize=30:x=110:y=150`,
      `drawtext=fontfile=${s.big ? FONT_BOLD : FONT}:textfile=${tf}:fontcolor=white:fontsize=${s.big ? 68 : 44}:line_spacing=${s.big ? 18 : 16}:x=110:y=215`,
      `drawtext=fontfile=${FONT_BOLD}:text='simmerly':fontcolor=0xce4620:fontsize=34:x=w-tw-80:y=h-80`,
      `fade=t=in:st=0:d=0.4,fade=t=out:st=${SLIDE_SECONDS - 0.4}:d=0.4`,
    ].join(",");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `color=c=0x1b1b1b:s=1280x720:d=${SLIDE_SECONDS}:r=25`, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "30", "-pix_fmt", "yuv420p", part]);
  });
  const list = path.join(tmp, "list.txt"); fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
  const out = path.join(OUT, `${slugify(r.t)}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out]);
  console.log(`✓ ${path.relative(process.cwd(), out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB, ${slides.length * SLIDE_SECONDS}s)`);
}
fs.rmSync(tmp, { recursive: true, force: true });
