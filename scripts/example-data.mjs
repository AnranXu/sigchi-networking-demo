import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
const { outputFiles } = await build({
  stdin: {
    contents:
      'export * from "./lib/demo-fixtures"; export * from "./lib/network-model"; export * from "./lib/pages-api";',
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const {
  conference,
  sessions,
  papers,
  personas,
  fixtureNote,
  rooms,
  backgrounds,
  restore,
  pagesRequest,
} = await import(
  "data:text/javascript;base64," +
    Buffer.from(outputFiles[0].contents).toString("base64")
);
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => memory.set(k, v),
};
const records = {
  description: fixtureNote,
  scope:
    "Public research and program metadata with synthetic sharing settings. Downloads through the attendees endpoint depend on the viewer.",
  conference,
  personas,
  backgrounds,
  sessions,
  papers,
  attendees: restore([]),
};
const prefix = "conferences/" + conference.id + "/";
const examples = [];
function example(as, method, path, body) {
  const { status, data } = pagesRequest(prefix + path, method, as, body);
  examples.push({
    as,
    method,
    path: "/api/demo/" + prefix + path,
    ...(body ? { body } : {}),
    response: { status, data },
  });
}
// Freeze the clock so the worked check-in example rebuilds identically.
Date.now = () => Date.parse("2026-04-14T08:00:00.000Z");
example("anran", "PATCH", "me/sharing", {
  field: "audience.profile",
  value: { mode: "attendees", people: [] },
});
example("anran", "PATCH", "me/sharing", {
  field: "audience.currentRoom",
  value: { mode: "selected", people: ["carla"] },
});
example("anran", "PATCH", "me/sharing", {
  field: "checkIn",
  value: { room: rooms[0] },
});
example("carla", "GET", "attendees/anran");
example("yun", "GET", "attendees/anran");
example("carla", "GET", "attendees?room=" + encodeURIComponent(rooms[0]));
example("anran", "PATCH", "me/sharing", { field: "checkIn", value: null });
example("anran", "PATCH", "me/sharing", {
  field: "audience.profile",
  value: { mode: "private", people: [] },
});
example("carla", "GET", "attendees/anran");
example("guest", "GET", "attendees/anran");
await mkdir("public/examples", { recursive: true });
for (const [name, value] of Object.entries({
  "synthetic-data": records,
  "requests-and-responses": examples,
})) {
  await writeFile(
    "public/examples/" + name + ".json",
    JSON.stringify(value, null, 2) + "\n",
  );
}
