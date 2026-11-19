import { conference, papers, sessions, rooms } from "./demo-fixtures";
import {
  restore,
  publicProfile,
  permits,
  audience,
  identities,
  type Audience,
  type Message,
  type Preference,
} from "./network-model";
export type DemoStore = { rows: Preference[]; messages: Message[] };
export type Change = { person: string; field: string; value: string };
export type Result = {
  status: number;
  data: any;
  changes?: Change[];
  message?: Omit<Message, "id">;
};
const result = (data: unknown, status = 200): Result => ({ status, data });
const error = (status: number, message: string) =>
  result({ error: message }, status);
const setting = (person: string, field: string, value: unknown) => ({
  person,
  field,
  value: JSON.stringify(value),
});
function safeLink(value: unknown, scholar = false) {
  if (typeof value !== "string" || value.length > 300) return false;
  if (value === "") return true;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      (!scholar || u.hostname === "scholar.google.com")
    );
  } catch {
    return false;
  }
}
export function serve(
  path: string,
  method: string,
  viewer: string,
  body: any,
  store: DemoStore,
  now = Date.now(),
): Result {
  const url = new URL(path, "https://demo.example"),
    prefix = "/conferences/" + conference.id + "/";
  if (path === "start" && method === "POST")
    return result({ demo: true, conference: conference.id });
  if (!url.pathname.startsWith(prefix))
    return error(404, "Unknown conference.");
  const route = url.pathname.slice(prefix.length),
    people = identities(store.rows);
  if (route === "profiles" && method === "POST") {
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name))
      return error(400, "Enter a name between 1 and 80 characters.");
    const id = "member-" + crypto.randomUUID();
    return {
      ...result({ id, name }, 201),
      changes: [setting(id, "identity", name)],
    };
  }
  const all = restore(store.rows, now),
    me = all.find((p) => p.id === viewer);
  const demoViewers = [...people, { id: "guest", name: "Unregistered guest" }];
  if (!me)
    return viewer === "guest" && route === "state" && method === "GET"
      ? result({
          viewer,
          own: null,
          directory: [],
          messages: [],
          identities: demoViewers,
        })
      : error(
          403,
          "Only registered attendees of this conference can access networking.",
        );
  const directory = all
    .filter((p) => permits(p.rules.profile, viewer))
    .map((p) => publicProfile(p, viewer));
  if (method === "GET" && route === "state")
    return result({
      viewer,
      own: me,
      directory,
      identities: demoViewers,
      messages: store.messages.filter(
        (m) => m.sender === viewer || m.recipient === viewer,
      ),
    });
  if (method === "GET" && route === "attendees") {
    const paper = url.searchParams.get("paper"),
      session = url.searchParams.get("session"),
      room = url.searchParams.get("room");
    if (
      (paper && !papers.some((p) => p.id === paper)) ||
      (session && !sessions.some((s) => s.id === session)) ||
      (room && !rooms.includes(room))
    )
      return error(400, "Unknown paper, room or session.");
    return result({
      conferenceId: conference.id,
      attendees: directory.filter(
        (p) =>
          (!paper || p.lists.some((l) => l.paperIds.includes(paper))) &&
          (!session || p.shared.includes(session)) &&
          (!room || p.checkIn?.room === room),
      ),
    });
  }
  if (method === "GET" && route.startsWith("attendees/")) {
    const p = all.find((p) => p.id === route.slice(10));
    return p && (permits(p.rules.profile, viewer) || p.id === viewer)
      ? result({
          conferenceId: conference.id,
          profile: publicProfile(p, viewer),
        })
      : error(404, "Profile unavailable.");
  }
  if (method === "PATCH" && route === "me/sharing") {
    const { field, value } = body ?? {};
    let changes: Change[] = [];
    const save = (k: string, v: unknown) => changes.push(setting(viewer, k, v));
    if (typeof field !== "string")
      return error(400, "Choose a sharing setting.");
    if (
      field.startsWith("audience.") &&
      Object.hasOwn(me.rules, field.slice(9))
    ) {
      const a = value as Audience;
      if (
        !a ||
        !["private", "attendees", "selected"].includes(a.mode) ||
        !Array.isArray(a.people) ||
        a.people.some((id) => id === viewer || !people.some((p) => p.id === id))
      )
        return error(400, "Choose a valid audience.");
      save(field, {
        mode: a.mode,
        people: a.mode === "selected" ? [...new Set(a.people)] : [],
      });
    } else if (
      (field === "profile" || me.lists.some((l) => field === "list." + l.id)) &&
      typeof value === "boolean"
    )
      save("audience." + field, audience(value));
    else if (
      sessions.some((s) => field === "session." + s.id) &&
      typeof value?.going === "boolean" &&
      typeof value?.shared === "boolean" &&
      (!value.shared || value.going)
    ) {
      save("going." + field.slice(8), value.going);
      if (!value.shared || me.rules[field].mode === "private")
        save("audience." + field, audience(value.shared));
    } else if (
      field === "links" &&
      safeLink(value?.website) &&
      safeLink(value?.scholar, true)
    )
      save(field, { website: value.website, scholar: value.scholar });
    else if (
      field === "checkIn" &&
      (value === null || rooms.includes(value?.room))
    )
      save(
        field,
        value ? { room: value.room, expiresAt: now + 3600000 } : null,
      );
    else if (
      me.lists.some((l) => field === "papers." + l.id) &&
      Array.isArray(value) &&
      value.every((id) => papers.some((p) => p.id === id))
    )
      save(field, [...new Set(value)]);
    else return error(400, "Invalid sharing preference or link.");
    return {
      ...result({
        conferenceId: conference.id,
        field,
        value: field === "checkIn" ? JSON.parse(changes[0].value) : value,
      }),
      changes,
    };
  }
  if (method === "POST" && route === "messages") {
    const { recipient, body: text } = body ?? {};
    if (!permits(me.rules.profile, recipient))
      return error(
        403,
        "Share your profile with the recipient to send a message.",
      );
    if (recipient === viewer || !directory.some((p) => p.id === recipient))
      return error(404, "Recipient unavailable.");
    if (typeof text !== "string" || !text.trim() || text.trim().length > 1000)
      return error(400, "Write a message of 1–1,000 characters.");
    return {
      ...result({}, 201),
      message: {
        sender: viewer,
        recipient,
        body: text.trim(),
        sent: new Date(now).toISOString(),
      },
    };
  }
  return error(404, "Unknown demo endpoint.");
}
