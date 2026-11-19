import { build } from "esbuild";
import { mkdir, writeFile, copyFile, cp } from "node:fs/promises";
import path from "node:path";

const output = path.resolve(process.argv[2] || "docs");
await mkdir(output, { recursive: true });
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
await copyFile("public/conference.png", path.join(output, "conference.png"));
await cp("public/examples", path.join(output, "examples"), { recursive: true });
await writeFile(path.join(output, ".nojekyll"), "");
await writeFile(
  path.join(output, "index.html"),
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="pages-demo" content="synthetic"><meta name="description" content="A SIGCHI hackathon prototype for exploring attendee profiles, reading lists and session sharing, using fictional data."><title>People · SIGCHI Programs demo</title><link rel="icon" href="./conference.png"><link rel="stylesheet" href="./app.css"></head><body><div id="app"></div><noscript>Enable JavaScript to explore the conference demo.</noscript><script type="module" src="./app.js"></script></body></html>`,
);
console.log("GitHub Pages site built in " + output);
