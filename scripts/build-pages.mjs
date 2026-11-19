import { buildRoomTools } from "./build-room-tools.mjs";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { mkdir, writeFile, copyFile, cp } from "node:fs/promises";
import path from "node:path";

const output = path.resolve(process.argv[2] || "docs");
await mkdir(output, { recursive: true });
await buildRoomTools(output);
await build({
  entryPoints: { app: "client/main.tsx" },
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  outdir: output,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
});
await copyFile("public/reminder-worker.js", path.join(output, "reminder-worker.js"));
await cp("public/fonts", path.join(output, "fonts"), { recursive: true });
await copyFile("public/sigchi.svg", path.join(output, "sigchi.svg"));
for (const logo of ["conference.png", "conference-2025.png"])
  await copyFile(path.join("public", logo), path.join(output, logo));
await cp("public/examples", path.join(output, "examples"), { recursive: true });
await writeFile(path.join(output, ".nojekyll"), "");
const stamp = async (file) =>
  createHash("sha256")
    .update(await readFile(path.join(output, file)))
    .digest("hex")
    .slice(0, 12);
const [cssVersion, jsVersion] = await Promise.all([
  stamp("app.css"),
  stamp("app.js"),
]);
await writeFile(
  path.join(output, "index.html"),
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="pages-demo" content="synthetic"><meta name="description" content="A SIGCHI hackathon prototype for exploring attendee profiles, reading lists and session sharing, with real CHI 2026 and CHI 2025 programs and conference-specific sharing."><title>CHI ’26 Programs · Networking demo</title><link rel="stylesheet" href="./fonts/montserrat.css"><link rel="icon" href="./conference.png"><link rel="stylesheet" href="./app.css?v=${cssVersion}"></head><body><div id="app"></div><noscript>Enable JavaScript to explore the conference demo.</noscript><script type="module" src="./app.js?v=${jsVersion}"></script></body></html>`,
);
console.log("GitHub Pages site built in " + output);
