import { people, papers, type Person } from "./demo-fixtures";
export type ReadingList = {
  id: string;
  name: string;
  paperIds: string[];
  visible: boolean;
};
export type DemoPerson = Person & { lists: ReadingList[] };
export type Profile = {
  id: string;
  name: string;
  affiliation: string;
  bio: string;
  topics: string[];
  color: string;
  links: Person["links"];
  authorKey: string;
  authored: string[];
  lists: ReadingList[];
  shared: string[];
};
export type Message = {
  id: number;
  sender: string;
  recipient: string;
  body: string;
  sent: string;
};
export type View = {
  viewer: string;
  own: DemoPerson | null;
  directory: Profile[];
  messages: Message[];
};
export type Change = { field: string; value: unknown };
export function restore(
  rows: { person: string; field: string; value: string }[],
): DemoPerson[] {
  return people.map((base) => {
    const p = structuredClone(base);
    const lists = [
      {
        id: "reading",
        name: p.listName,
        paperIds: [...p.saved],
        visible: p.listVisible,
      },
      {
        id: "later",
        name: "Read after the conference",
        paperIds: ["p8"],
        visible: false,
      },
    ];
    for (const r of rows.filter((r) => r.person === p.id)) {
      const v = JSON.parse(r.value);
      if (r.field === "profile") p.profileVisible = v;
      if (r.field === "links") p.links = v;
      if (r.field.startsWith("list.")) {
        const list = lists.find((l) => l.id === r.field.slice(5));
        if (list) list.visible = v;
      }
      if (r.field.startsWith("session.")) {
        const id = r.field.slice(8);
        p.going = p.going.filter((s) => s !== id);
        p.shared = p.shared.filter((s) => s !== id);
        if (v.going) p.going.push(id);
        if (v.going && v.shared) p.shared.push(id);
      }
    }
    return { ...p, lists };
  });
}
export function publicProfile(p: DemoPerson): Profile {
  return {
    id: p.id,
    name: p.name,
    affiliation: p.affiliation,
    bio: p.bio,
    topics: p.topics,
    color: p.color,
    links: p.links,
    authorKey: p.authorKey,
    authored: p.authorKey
      ? papers.filter((a) => a.authors.includes(p.authorKey)).map((a) => a.id)
      : [],
    lists: p.lists.filter((l) => l.visible),
    shared: p.shared.filter((s) => p.going.includes(s)),
  };
}
export function overlap(own: DemoPerson, p: Profile) {
  const interests = p.topics.filter((t) => own.topics.includes(t));
  const saved = new Set(own.lists.flatMap((l) => l.paperIds));
  const commonPapers = [...new Set(p.lists.flatMap((l) => l.paperIds))].filter(
    (id) => saved.has(id),
  );
  const commonSessions = p.shared.filter((id) => own.going.includes(id));
  return {
    interests,
    commonPapers,
    commonSessions,
    score: interests.length + commonPapers.length + commonSessions.length,
  };
}
