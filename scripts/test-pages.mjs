import assert from "node:assert/strict";
import { build } from "esbuild";
const { outputFiles } = await build({
  stdin: {
    contents:
      'export * from "./lib/pages-api";export * from "./lib/demo-fixtures";',
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { pagesRequest, conference, rooms, papers, sessions, backgrounds } =
  await import(
    "data:text/javascript;base64," +
      Buffer.from(outputFiles[0].contents).toString("base64")
  );
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, v),
};
const req = (viewer, method, path, body) =>
  pagesRequest(
    "conferences/" + conference.id + "/" + path,
    method,
    viewer,
    body,
  );
const get = (v, p) => req(v, "GET", p);
assert.equal(req("guest", "POST", "profiles", { name: " " }).status, 400);
const created = req("guest", "POST", "profiles", { name: "Jamie Example" });
assert.equal(created.status, 201);
const id = created.data.id,
  person = "attendees/" + id;
const set = (field, value) =>
  assert.equal(req(id, "PATCH", "me/sharing", { field, value }).status, 200);
const only = (people) => ({ mode: "selected", people }),
  everyone = { mode: "attendees", people: [] };
const has = (v, path) => get(v, path).data.attendees.some((p) => p.id === id);
assert.equal(get("guest", person).status, 403);
assert.equal(get("carla", person).status, 404);
assert.deepEqual(get(id, "state").data.own.going, []);
set("audience.profile", only(["carla"]));
set("audience.currentRoom", only(["carla"]));
set("checkIn", { room: rooms[0] });
assert.equal(get("carla", person).data.profile.checkIn.room, rooms[0]);
assert.equal(get("yun", person).status, 404);
assert.equal(
  has("yun", "attendees?room=" + encodeURIComponent(rooms[0])),
  false,
);
set("audience.profile", everyone);
assert.equal(get("yun", person).data.profile.checkIn, null);
set("papers.reading", [papers[0].id]);
set("audience.list.reading", only(["yun"]));
assert.equal(has("yun", "attendees?paper=" + papers[0].id), true);
assert.equal(has("carla", "attendees?paper=" + papers[0].id), false);
set("session." + sessions[0].id, { going: true, shared: false });
set("audience.session." + sessions[0].id, only(["carla"]));
assert.equal(has("carla", "attendees?session=" + sessions[0].id), true);
assert.equal(has("yun", "attendees?session=" + sessions[0].id), false);
const at = Date.now;
try {
  Date.now = () => at() + 3600001;
  assert.equal(get("carla", person).data.profile.checkIn, null);
} finally {
  Date.now = at;
}
set("checkIn", null);
assert.equal(get("carla", person).data.profile.checkIn, null);
assert.ok(get("carla", person).data.profile.shared.includes(sessions[0].id));
assert.equal(
  req(id, "POST", "messages", {
    recipient: "carla",
    body: "Meet after the session?",
  }).status,
  201,
);
assert.equal(
  get("carla", "state").data.messages[0].body,
  "Meet after the session?",
);
assert.equal(get("yun", "state").data.messages.length, 0);
assert.equal(
  req(id, "PATCH", "me/sharing", {
    field: "links",
    value: { website: "javascript:alert(1)", scholar: "" },
  }).status,
  400,
);
set("audience.profile", { mode: "private", people: [] });
assert.equal(get("carla", person).status, 404);
const namedAudience = req("guest", "POST", "profiles", {
  name: "Invite only",
  audience: only(["carla"]),
});
assert.equal(namedAudience.status, 201);
assert.equal(get("carla", "attendees/" + namedAudience.data.id).status, 200);
assert.equal(get("yun", "attendees/" + namedAudience.data.id).status, 404);
const openProfile = req("guest", "POST", "profiles", {
  name: "Open profile",
  audience: everyone,
});
assert.equal(get("yun", "attendees/" + openProfile.data.id).status, 200);
const countBefore = get("guest", "state").data.identities.length;
assert.equal(
  req("guest", "POST", "profiles", {
    name: "Invalid",
    audience: only(["missing-id"]),
  }).status,
  400,
);
assert.equal(get("guest", "state").data.identities.length, countBefore);
for (const b of backgrounds) {
  assert.ok(b.source.startsWith("https://"));
  assert.ok(b.recommended.every((id) => papers.some((p) => p.id === id)));
  if (b.authorKey)
    assert.ok(papers.some((p) => p.authors.includes(b.authorKey)));
}
assert.ok(
  papers.every(
    (p) =>
      p.doi.startsWith("https://doi.org/") &&
      p.authorNames.length &&
      sessions.some((s) => s.papers.includes(p.id)),
  ),
);
console.log(
  "Passed name-only creation, audience intersection, check-in expiry and revocation, plans, downloads, messaging and publication integrity.",
);
