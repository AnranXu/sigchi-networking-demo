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
    "Entire fictional seed, including private examples. The attendee endpoint returns an audience-filtered subset.",
  conference,
  personas,
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
example("leo", "GET", "attendees/mira");
example("mira", "PATCH", "me/sharing", { field: "profile", value: true });
example("leo", "GET", "attendees/mira");
example("mira", "PATCH", "me/sharing", { field: "list.reading", value: true });
example("mira", "PATCH", "me/sharing", {
  field: "session.s1",
  value: { going: true, shared: true },
});
example("leo", "GET", "attendees/mira");
example("guest", "GET", "attendees/mira");
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
