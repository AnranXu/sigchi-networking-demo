export const conference = {
  id: "uist-demo",
  name: "UIST ’25",
  city: "Busan",
  edition: "Fictional program",
};
export const sessions = [
  {
    id: "s1",
    name: "Designing for access",
    room: "Capri",
    time: "Mon · 09:00",
    papers: ["p1", "p2"],
  },
  {
    id: "s2",
    name: "Collaboration in practice",
    room: "Sicily",
    time: "Mon · 11:00",
    papers: ["p3", "p4"],
  },
  {
    id: "s3",
    name: "Tangible interfaces",
    room: "Palermo",
    time: "Tue · 09:00",
    papers: ["p5", "p6"],
  },
  {
    id: "s4",
    name: "Tools for creative work",
    room: "Capri",
    time: "Tue · 14:00",
    papers: ["p7", "p8"],
  },
];
export const papers = [
  {
    id: "p1",
    title: "Tactile Paths for Shared Diagrams",
    authors: ["orcid-demo-02", "orcid-demo-03"],
    topics: ["Accessibility", "Haptics"],
  },
  {
    id: "p2",
    title: "Describing Changes in Collaborative Canvases",
    authors: ["orcid-demo-04"],
    topics: ["Accessibility", "Collaboration"],
  },
  {
    id: "p3",
    title: "Small Signals in Hybrid Teamwork",
    authors: ["orcid-demo-05"],
    topics: ["Collaboration", "Social computing"],
  },
  {
    id: "p4",
    title: "Finding Common Ground in Design Critiques",
    authors: ["orcid-demo-07"],
    topics: ["Collaboration", "Design tools"],
  },
  {
    id: "p5",
    title: "Sketching with Programmable Surfaces",
    authors: ["orcid-demo-06"],
    topics: ["Haptics", "Fabrication"],
  },
  {
    id: "p6",
    title: "Listening to Materials Through Touch",
    authors: ["orcid-demo-03"],
    topics: ["Haptics", "Accessibility"],
  },
  {
    id: "p7",
    title: "A Shared Notebook for Creative Coding",
    authors: ["orcid-demo-08"],
    topics: ["Design tools", "Collaboration"],
  },
  {
    id: "p8",
    title: "Prototyping Interfaces with Paper Circuits",
    authors: ["orcid-demo-09"],
    topics: ["Fabrication", "Design tools"],
  },
];
export type Links = { website: string; scholar: string };
export type Person = {
  id: string;
  name: string;
  affiliation: string;
  bio: string;
  topics: string[];
  color: string;
  authorKey: string;
  links: Links;
  profileVisible: boolean;
  listVisible: boolean;
  listName: string;
  saved: string[];
  going: string[];
  shared: string[];
};
const rows = [
  [
    "mira",
    "Mira Patel",
    "Northbank Design Lab",
    "I study how people work together with accessible creative tools.",
    "Accessibility|Collaboration|Design tools",
    "lilac",
    "",
    "Access & collaboration",
    "p1 p2 p3",
    "s1 s2",
  ],
  [
    "leo",
    "Leo Kim",
    "Harbor Interaction Lab",
    "I build tactile interfaces that make collaborative diagrams easier to explore.",
    "Accessibility|Haptics|Collaboration",
    "teal",
    "02",
    "Tangible access",
    "p1 p2 p6",
    "s1 s3",
  ],
  [
    "ines",
    "Inés Costa",
    "Studio for Inclusive Systems",
    "My work brings touch and sound into everyday information design.",
    "Haptics|Accessibility",
    "rose",
    "03",
    "Touch and sound",
    "p1 p5 p6",
    "s1 s3",
  ],
  [
    "noah",
    "Noah Brooks",
    "Eastwell University",
    "I design collaborative canvases with blind and low-vision creators.",
    "Accessibility|Collaboration",
    "blue",
    "04",
    "Shared canvases",
    "p1 p2 p4",
    "s1 s2",
  ],
  [
    "yuna",
    "Yuna Park",
    "Fieldwork Studio",
    "I look at the subtle cues people use to coordinate hybrid work.",
    "Social computing|Collaboration",
    "amber",
    "05",
    "Hybrid teamwork",
    "p3 p4",
    "s2",
  ],
  [
    "sol",
    "Sol Rivera",
    "Form & Fabric Lab",
    "I make programmable materials people can shape with their hands.",
    "Fabrication|Haptics",
    "mint",
    "06",
    "Material studies",
    "p5 p6 p8",
    "s3",
  ],
  [
    "amara",
    "Amara Diallo",
    "Neighbourhood Computing",
    "I study how groups exchange feedback during creative work.",
    "Design tools|Collaboration",
    "coral",
    "07",
    "Design conversations",
    "p4 p7",
    "s2 s4",
  ],
  [
    "eli",
    "Eli Chen",
    "Open Instrument Studio",
    "I prototype new tools for live coding and collective sketching.",
    "Design tools|Creative coding",
    "periwinkle",
    "08",
    "Creative instruments",
    "p7 p8",
    "s4",
  ],
  [
    "robin",
    "Robin Vale",
    "Maker Studies Group",
    "I explore low-cost circuits for rapid prototyping.",
    "Fabrication|Design tools",
    "olive",
    "09",
    "Making together",
    "p5 p8",
    "s4",
  ],
];
export const people: Person[] = rows.map(
  ([
    id,
    name,
    affiliation,
    bio,
    topics,
    color,
    key,
    listName,
    saved,
    going,
  ]) => ({
    id,
    name,
    affiliation,
    bio,
    topics: topics.split("|"),
    color,
    authorKey: key ? "orcid-demo-" + key : "",
    links: {
      website: `https://example.org/research/${id}`,
      scholar:
        "https://scholar.google.com/scholar?q=" +
        encodeURIComponent(topics.split("|")[0] + " interaction design"),
    },
    profileVisible: !["mira", "robin"].includes(id),
    listVisible: !["mira", "ines", "robin"].includes(id),
    listName,
    saved: saved.split(" "),
    going: going.split(" "),
    shared: ["mira", "noah", "robin"].includes(id)
      ? []
      : going.split(" ").slice(0, 1),
  }),
);
export const personas = [
  { id: "mira", name: "Mira Patel" },
  { id: "leo", name: "Leo Kim" },
  { id: "guest", name: "Unregistered guest" },
];
export const fixtureNote =
  "All attendees, papers, affiliations, author identifiers, and plans are synthetic. ORCID matching is illustrated with demo identifiers; website links use example.org and Scholar links open topic searches.";
