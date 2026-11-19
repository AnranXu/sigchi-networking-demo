import assert from "node:assert/strict";
import { build } from "esbuild";
const { outputFiles } = await build({
  stdin: {
    contents:
      'export * from "./lib/room-identification";export * from "./lib/pages-api";export * from "./lib/demo-fixtures";',
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const {
  roomFromQr,
  roomFromSign,
  pagesRequest,
  conference,
  rooms,
  papers,
  sessions,
  backgrounds,
} = await import(
  "data:text/javascript;base64," +
    Buffer.from(outputFiles[0].contents).toString("base64")
);
const roomKey = "https://anranxu.github.io/sigchi-networking-demo/#chi26-room=";
assert.equal(roomFromQr(roomKey + "12307"), "P1 - Room 115");
assert.equal(roomFromQr(roomKey + "999999"), null);
assert.equal(roomFromQr("https://example.org/#chi26-room=12307"), null);
assert.equal(roomFromQr(roomKey + "12307&next=elsewhere"), null);
assert.equal(roomFromSign("SALA 115", 92), "P1 - Room 115");
assert.equal(roomFromSign("116", 93), "P1 - Room 116");
assert.equal(
  roomFromSign("Area 1 + 2 + 3: theatre", 88),
  "Area 1 + 2 + 3: theatre",
);
assert.equal(roomFromSign("Room 115 / Room 116", 99), null);
assert.equal(roomFromSign("Room 115", 40), null);
assert.equal(roomFromSign("Main programme 115", 90), null);
assert.equal(roomFromSign("ROOM 999", 99), null);
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
// A name-only account can share different data with different people at two conferences.
const atEvent = (event, who, method, path, body) =>
  pagesRequest("conferences/" + event + "/" + path, method, who, body);
const ky = (who, method, path, body) =>
  atEvent("chi25-demo", who, method, path, body);
const save25 = (who, field, value) =>
  assert.equal(ky(who, "PATCH", "me/sharing", { field, value }).status, 200);
const read25 = (who, route) => ky(who, "GET", route);
assert.equal(read25(id, "state").data.own.rules.profile.mode, "private");
assert.equal(read25("carla", person).status, 404);
assert.equal(read25("carla", "state").data.messages.length, 0);
assert.equal(
  read25("carla", "state").data.identities.some((p) => p.id === id),
  false,
);
save25(id, "audience.profile", only(["yun"]));
save25(id, "audience.currentRoom", only(["yun"]));
save25(id, "checkIn", { room: "G401" });
save25(id, "papers.reading", ["188995"]);
save25(id, "audience.list.reading", everyone);
save25(id, "session.197231", { going: true, shared: true });
save25(id, "links", { website: "https://example.org/yokohama", scholar: "" });
save25(id, "audience.links", everyone);
const projection = read25("yun", person).data;
assert.equal(projection.conferenceId, "chi25-demo");
assert.equal(projection.profile.checkIn.room, "G401");
assert.equal(projection.profile.links.website, "https://example.org/yokohama");
assert.deepEqual(projection.profile.shared, ["197231"]);
assert.deepEqual(projection.profile.lists[0].paperIds, ["188995"]);
assert.equal(read25("carla", person).status, 404);
assert.equal(get("yun", person).status, 404);
set("audience.profile", everyone);
assert.equal(get("yun", person).data.profile.checkIn, null);
assert.equal(get("yun", person).data.profile.links.website, "");
assert.deepEqual(get("yun", person).data.profile.lists[0].paperIds, [
  papers[0].id,
]);
assert.equal(read25("carla", person).status, 404);
assert.equal(
  ky(id, "PATCH", "me/sharing", { field: "checkIn", value: { room: rooms[0] } })
    .status,
  400,
);
assert.equal(
  ky(id, "PATCH", "me/sharing", {
    field: "papers.reading",
    value: [papers[0].id],
  }).status,
  400,
);
save25("yun", "audience.profile", everyone);
assert.equal(
  ky(id, "POST", "messages", { recipient: "yun", body: "Yokohama only" })
    .status,
  201,
);
assert.deepEqual(
  read25("yun", "state").data.messages.map((m) => m.body),
  ["Yokohama only"],
);
assert.equal(get("yun", "state").data.messages.length, 0);
assert.equal(atEvent("unknown", "yun", "GET", "state").status, 404);
const localOnly = ky("guest", "POST", "profiles", {
  name: "Yokohama example",
  audience: everyone,
}).data.id;
assert.equal(read25("yun", "attendees/" + localOnly).status, 200);
assert.equal(get("yun", "attendees/" + localOnly).status, 404);
assert.equal(get(localOnly, "state").data.own.rules.profile.mode, "private");

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
