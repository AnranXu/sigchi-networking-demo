import path from "node:path";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import QRCode from "qrcode";

export async function buildRoomTools(publicDirectory) {
  const tools = path.join(publicDirectory, "room-tools");
  const codes = path.join(publicDirectory, "room-codes");
  await Promise.all([
    mkdir(tools, { recursive: true }),
    mkdir(codes, { recursive: true }),
  ]);
  const assets = [
    ["tesseract.js/dist/worker.min.js", "worker.min.js"],
    [
      "tesseract.js/dist/worker.min.js.LICENSE.txt",
      "worker.min.js.LICENSE.txt",
    ],
    [
      "tesseract.js-core/tesseract-core-lstm.wasm.js",
      "tesseract-core-lstm.wasm.js",
    ],
    ["tesseract.js-core/LICENSE", "LICENSE-ocr.txt"],
    ["tesseract.js/LICENSE.md", "LICENSE-tesseract.txt"],
    ["jsqr/LICENSE", "LICENSE-jsqr.txt"],
    [
      "@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz",
      "eng.traineddata.gz",
    ],
  ];
  await Promise.all(
    assets.map(([input, output]) =>
      copyFile(path.join("node_modules", input), path.join(tools, output)),
    ),
  );
  const rooms = JSON.parse(await readFile("lib/chi26-room-codes.json", "utf8"));
  const cards = [];
  for (const room of rooms) {
    const link = new URL("https://anranxu.github.io/sigchi-networking-demo/");
    link.hash = "chi26-room=" + room.id;
    const file = "chi26-room-" + room.id + ".png";
    await QRCode.toFile(path.join(codes, file), link.href, {
      width: 384,
      margin: 4,
      errorCorrectionLevel: "M",
    });
    cards.push(
      `<article><h2>${room.name}</h2><img width="192" height="192" src="./${file}" alt="Check-in QR code for ${room.name}"><span><a href="./${file}" download>Download QR</a> · <a href="${link.href}">Open room</a></span></article>`,
    );
  }
  await writeFile(
    path.join(codes, "index.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHI ’26 room codes</title><style>*{box-sizing:border-box}body{margin:0 auto;padding:1.5rem;max-width:65rem;color:#25293a;background:#f4f5f9;font:1rem/1.5 system-ui}h1{margin:0;font-size:1.6rem}h2{font-size:1rem;margin:0}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr));gap:1rem}article{padding:1rem;text-align:center;background:#fff;border:1px solid #cbd2e2;border-radius:.5rem;break-inside:avoid}img{max-width:100%;height:auto;display:block;margin:.25rem auto}a{color:#24499a;display:inline-block;padding:.4rem 0}button{font:inherit;margin-bottom:1rem;padding:.5rem 1rem}@media print{body{background:white;padding:0}button,article a,article span{display:none}main{display:grid;grid-template-columns:repeat(3,1fr)}article{border-color:#888}img{width:35mm}}</style></head><body><header><h1>CHI ’26 room codes</h1><p>Display or print a code at the room entrance. Scanning it selects the room in the networking demo.</p><button type="button" onclick="window.print()">Print room codes</button></header><main>${cards.join("\n")}</main></body></html>`,
  );
}
