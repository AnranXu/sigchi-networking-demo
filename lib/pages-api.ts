import { conference, papers, personas, sessions } from "./demo-fixtures";
import { restore, publicProfile, type Message } from "./network-model";
type Preference = { person: string; field: string; value: string };
type LocalStore = { rows: Preference[]; messages: Message[] };
const key = "sigchi-networking-lab.v1";
function read(): LocalStore {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : { rows: [], messages: [] };
}
export function pagesRequest(
  path: string,
  method: string,
  viewer: string,
  body: any,
): { status: number; data: any } {
  const ok = (data: any, status = 200) => ({ status, data });
  const fail = (status: number, error: string) => ok({ error }, status);
  if (path === "start" && method === "POST")
    return ok({ demo: true, conference: conference.id, personas });
  const url = new URL(path, "https://demo.example/");
  const pref = "/conferences/" + conference.id + "/";
  if (!url.pathname.startsWith(pref)) return fail(404, "Unknown conference.");
  const route = url.pathname.slice(pref.length);
  if (viewer === "guest")
    return route === "state" && method === "GET"
      ? ok({ viewer, own: null, directory: [], messages: [] })
      : fail(
          403,
          "Only registered attendees of this conference can access networking.",
        );
  if (!personas.some((p) => p.id === viewer))
    return fail(403, "Unknown demo persona.");
  const store = read(),
    all = restore(store.rows),
    me = all.find((p) => p.id === viewer)!;
  const directory = all.filter((p) => p.profileVisible).map(publicProfile);
  if (method === "GET" && route === "state")
    return ok({
      viewer,
      own: me,
      directory,
      messages: store.messages.filter(
        (m) => m.sender === viewer || m.recipient === viewer,
      ),
    });
  if (method === "GET" && route === "attendees") {
    const paper = url.searchParams.get("paper"),
      session = url.searchParams.get("session");
    if (
      (paper && !papers.some((p) => p.id === paper)) ||
      (session && !sessions.some((s) => s.id === session))
    )
      return fail(400, "Unknown paper or session.");
    return ok({
      conferenceId: conference.id,
      attendees: directory.filter(
        (p) =>
          (!paper || p.lists.some((l) => l.paperIds.includes(paper))) &&
          (!session || p.shared.includes(session)),
      ),
    });
  }
  if (method === "GET" && route.startsWith("attendees/")) {
    const p = all.find((p) => p.id === route.slice(10));
    return p && (p.profileVisible || p.id === viewer)
      ? ok({ conferenceId: conference.id, profile: publicProfile(p) })
      : fail(404, "Profile unavailable.");
  }
  if (method === "PATCH" && route === "me/sharing") {
    if (!body || typeof body !== "object" || Array.isArray(body))
      return fail(400, "Invalid request.");
    const { field, value } = body;
    const list = me.lists.some((l) => "list." + l.id === field),
      session = sessions.some((s) => "session." + s.id === field);
    const valid =
      ((field === "profile" || list) && typeof value === "boolean") ||
      (session &&
        value &&
        typeof value.going === "boolean" &&
        typeof value.shared === "boolean" &&
        (!value.shared || value.going)) ||
      (field === "links" &&
        value &&
        [value.website, value.scholar].every((v) => {
          if (typeof v !== "string" || v.length > 300) return false;
          if (v === "") return true;
          try {
            const u = new URL(v);
            return u.protocol === "https:" && !u.username && !u.password;
          } catch {
            return false;
          }
        }) &&
        (!value.scholar ||
          new URL(value.scholar).hostname === "scholar.google.com"));
    if (!valid) return fail(400, "Invalid sharing preference or link.");
    store.rows = store.rows.filter(
      (r) => r.person !== viewer || r.field !== field,
    );
    const clean = session
      ? { going: value.going, shared: value.shared }
      : field === "links"
        ? { website: value.website, scholar: value.scholar }
        : value;
    store.rows.push({ person: viewer, field, value: JSON.stringify(clean) });
    localStorage.setItem(key, JSON.stringify(store));
    return ok({ conferenceId: conference.id, field, value: clean });
  }
  if (method === "POST" && route === "messages") {
    if (!body || typeof body !== "object" || Array.isArray(body))
      return fail(400, "Invalid request.");
    const { recipient, body: text } = body;
    if (!me.profileVisible)
      return fail(403, "Make your profile visible to send a message.");
    if (recipient === viewer || !directory.some((p) => p.id === recipient))
      return fail(404, "Recipient unavailable.");
    if (typeof text !== "string" || !text.trim() || text.trim().length > 1000)
      return fail(400, "Write a message of 1–1,000 characters.");
    const id = (store.messages.at(-1)?.id || 0) + 1;
    store.messages.push({
      id,
      sender: viewer,
      recipient,
      body: text.trim(),
      sent: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(store));
    return ok({ messageId: id }, 201);
  }
  return fail(404, "Unknown demo endpoint.");
}
