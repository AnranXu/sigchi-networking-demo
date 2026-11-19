"use client";
import React, { useState, useEffect, useRef, type ReactNode } from "react";
import {
  Users,
  UserRound,
  CalendarDays,
  Network,
  MessagesSquare,
  Code2,
  Menu,
  X,
  Search,
  SlidersHorizontal,
  BookOpen,
  LockKeyhole,
  Eye,
  Globe,
  GraduationCap,
  Bookmark,
  ChevronRight,
  Download,
  Check,
  Send,
  Orbit,
  FlaskConical,
} from "lucide-react";
import { sessions, papers, personas, fixtureNote } from "@/lib/demo-fixtures";
import {
  overlap,
  publicProfile,
  type Profile,
  type View,
} from "@/lib/network-model";
import {
  callApi,
  loadView,
  prefix,
  downloadJson,
  isStatic,
} from "@/lib/client-api";
type Page =
  | "People"
  | "Program"
  | "My lists"
  | "My profile"
  | "Messages"
  | "API examples";
const navigation: [Page, typeof Users][] = [
  ["Program", CalendarDays],
  ["People", Users],
  ["My lists", Bookmark],
  ["My profile", UserRound],
  ["Messages", MessagesSquare],
  ["API examples", Code2],
];
const paperName = (id: string) => papers.find((p) => p.id === id)?.title || id;
const sessionName = (id: string) =>
  sessions.find((p) => p.id === id)?.name || id;
const initials = (n: string) =>
  n
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
function Avatar({
  name,
  color,
  large = false,
}: {
  name: string;
  color: string;
  large?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={"avatar " + color + (large ? " large" : "")}
    >
      {initials(name)}
    </span>
  );
}
function Toggle({
  on,
  label,
  change,
  disabled = false,
}: {
  on: boolean;
  label: string;
  change: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={"switch " + (on ? "on" : "")}
      onClick={change}
    >
      <span />
    </button>
  );
}
function Dialog({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close();
        }
      }}
    >
      <div className="drawerTop">
        <span>{title}</span>
        <button className="iconBtn" aria-label="Close panel" onClick={close}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
const captions: Record<Page, string> = {
  People: "Find attendees by research interest, paper, or session.",
  Program: "Explore the demo program and choose which session plans to share.",
  "My lists": "Choose which reading lists other attendees can discover.",
  "My profile": "Manage what registered attendees can see at this conference.",
  Messages: "Conversations between fictional attendees in this demo.",
  "API examples":
    "Inspect and download the responses behind the networking features.",
};
type Trace = { method: string; path: string; status: number; data: any };
export default function NetworkUI() {
  const [viewer, setViewer] = useState("mira"),
    [view, setView] = useState<View | null>(null),
    [page, setPage] = useState<Page>("People");
  const [tab, setTab] = useState("all"),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState(""),
    [filtersOpen, setFiltersOpen] = useState(false),
    [authorOnly, setAuthorOnly] = useState(false);
  const [profile, setProfile] = useState<string | null>(null),
    [previewing, setPreviewing] = useState(false),
    [thread, setThread] = useState<string | null>(null),
    [text, setText] = useState(""),
    [navOpen, setNavOpen] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [reload, setReload] = useState(0);
  const [trace, setTrace] = useState<Trace | null>(null),
    [probe, setProbe] = useState("attendees"),
    [web, setWeb] = useState(""),
    [scholar, setScholar] = useState("");
  const generation = useRef(0);
  useEffect(() => {
    try {
      const s = localStorage.getItem("sigchi.demo.persona");
      if (personas.some((p) => p.id === s)) setViewer(s!);
    } catch {}
  }, []);
  useEffect(() => {
    const id = ++generation.current;
    setView(null);
    setError("");
    (async () => {
      await callApi("start", viewer, "POST");
      const data = await loadView(viewer);
      if (id === generation.current) setView(data);
    })().catch((e) => {
      if (id === generation.current) setError(e.message);
    });
    return () => {
      generation.current++;
    };
  }, [viewer, reload]);
  useEffect(() => {
    setWeb(view?.own?.links.website || "");
    setScholar(view?.own?.links.scholar || "");
  }, [view?.own?.links.website, view?.own?.links.scholar, viewer]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2800);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!isStatic()) return;
    let live = true;
    const sync = async (e: StorageEvent) => {
      if (e.key === "sigchi-networking-lab.v1") {
        const d = await loadView(viewer);
        if (live) setView(d);
      }
    };
    window.addEventListener("storage", sync);
    return () => {
      live = false;
      window.removeEventListener("storage", sync);
    };
  }, [viewer]);
  const me = view?.own;
  const directory = view?.directory || [];
  const external = directory.filter((p) => p.id !== viewer);
  function switchViewer(id: string) {
    setViewer(id);
    localStorage.setItem("sigchi.demo.persona", id);
    setProfile(null);
    setPreviewing(false);
    setThread(null);
    setText("");
    setError("");
    setNotice("");
    setTrace(null);
    setProbe("attendees");
    setQ("");
    setFilter("");
    setNavOpen(false);
  }
  function navigate(p: Page) {
    setPage(p);
    setNavOpen(false);
    setThread(null);
    setProfile(null);
    setPreviewing(false);
    setFiltersOpen(false);
    setError("");
  }
  async function request(path: string, method = "GET", body?: unknown) {
    const r = await callApi<any>(prefix + path, viewer, method, body);
    setTrace({
      method,
      path: "/api/demo/" + prefix + path,
      status: r.status,
      data: r.data,
    });
    return r;
  }
  async function change(field: string, value: unknown) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await request("me/sharing", "PATCH", { field, value });
      if (r.status >= 400) throw Error(r.data.error);
      setView(await loadView(viewer));
      setNotice("Changes saved");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function listFor(value: string) {
    navigate("People");
    setTab("all");
    setQ("");
    setFilter(value);
    setAuthorOnly(false);
  }
  const filtered = external
    .filter((p) => {
      if (authorOnly && !p.authored.length) return false;
      if (
        filter.startsWith("paper:") &&
        !p.lists.some((l) => l.paperIds.includes(filter.slice(6)))
      )
        return false;
      if (filter.startsWith("session:") && !p.shared.includes(filter.slice(8)))
        return false;
      const words = [
        p.name,
        p.affiliation,
        ...p.topics,
        ...p.authored.map(paperName),
        ...p.lists.flatMap((l) => l.paperIds.map(paperName)),
        ...p.shared.map(sessionName),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return (
        words.includes(q.trim().toLocaleLowerCase()) &&
        (tab !== "matches" || !!(me && overlap(me, p).score))
      );
    })
    .sort((a, b) =>
      tab === "matches" && me ? overlap(me, b).score - overlap(me, a).score : 0,
    );
  const selected =
    previewing && me?.profileVisible
      ? publicProfile(me)
      : directory.find((p) => p.id === profile);
  const filterLabel = filter.startsWith("paper:")
    ? paperName(filter.slice(6))
    : filter.startsWith("session:")
      ? sessionName(filter.slice(8))
      : "";
  async function exportProfile(p: Profile) {
    try {
      const r = await request("attendees/" + p.id);
      if (r.status !== 200) throw Error(r.data.error);
      downloadJson(p.id + "-profile.json", r.data);
      setNotice("Profile downloaded");
    } catch (e: any) {
      setError(e.message);
    }
  }
  function startChat(id: string) {
    navigate("Messages");
    setThread(id);
    setText("");
  }
  async function send() {
    if (!thread || !text.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await request("messages", "POST", {
        recipient: thread,
        body: text,
      });
      if (r.status !== 201) throw Error(r.data.error);
      setText("");
      setView(await loadView(viewer));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function runProbe() {
    setError("");
    try {
      await request(probe);
    } catch (e: any) {
      setError(e.message);
    }
  }
  function myRail() {
    if (!me) return null;
    return (
      <aside className="rail">
        <section className="panel selfCard">
          <div className="railHeading">
            <UserRound size={17} />
            My conference profile
          </div>
          <div className="myIdentity">
            <Avatar name={me.name} color={me.color} large />
            <h3>{me.name}</h3>
            <p>{me.affiliation}</p>
          </div>
          <div className="visibility">
            <div>
              <strong>Visible to attendees</strong>
              <small>
                {me.profileVisible ? "In the directory" : "Only you can see it"}
              </small>
            </div>
            <Toggle
              label="Visible to registered attendees"
              on={me.profileVisible}
              disabled={busy}
              change={() => change("profile", !me.profileVisible)}
            />
          </div>
          <button
            className="outlined wide"
            onClick={() => navigate("My profile")}
          >
            Manage profile <ChevronRight size={16} />
          </button>
        </section>
        <section className="railNote">
          <div>
            <FlaskConical size={17} />
            <b>Try another perspective</b>
          </div>
          <p>
            Switch between fictional attendees to see how sharing changes the
            directory.
          </p>
          <label htmlFor="railViewer">Demo attendee</label>
          <select
            id="railViewer"
            value={viewer}
            onChange={(e) => switchViewer(e.target.value)}
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </section>
      </aside>
    );
  }
  function card(p: Profile) {
    const match = me ? overlap(me, p) : null;
    return (
      <button
        className="personCard"
        key={p.id}
        onClick={() => setProfile(p.id)}
      >
        <div className="personTop">
          <Avatar name={p.name} color={p.color} />
          <div>
            <h3>{p.name}</h3>
            <p>{p.affiliation}</p>
          </div>
        </div>
        <div className="chips">
          {p.topics.slice(0, 2).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="cardFoot">
          <span>
            {tab === "matches" && match ? (
              <>
                <Network size={14} />
                {match.score} shared {match.score === 1 ? "signal" : "signals"}
              </>
            ) : (
              <>
                <BookOpen size={14} />
                {p.lists.length} shared{" "}
                {p.lists.length === 1 ? "list" : "lists"}
              </>
            )}
          </span>
          <ChevronRight size={16} />
        </div>
      </button>
    );
  }
  function myLists() {
    return (
      <>
        {me?.lists.map((l) => (
          <section className="panel record" key={l.id}>
            <div className="recordHead">
              <div className="row">
                <span className="tile">
                  <Bookmark />
                </span>
                <div>
                  <h3>{l.name}</h3>
                  <small>{l.paperIds.length} papers</small>
                </div>
              </div>
              <Toggle
                label={"Share " + l.name}
                on={l.visible}
                disabled={busy}
                change={() => change("list." + l.id, !l.visible)}
              />
            </div>
            <p className="muted">
              {l.visible
                ? me.profileVisible
                  ? "Visible to registered attendees"
                  : "Selected for sharing when your profile is visible"
                : "Private list"}
            </p>
            <ul className="lines">
              {l.paperIds.map((id) => (
                <li key={id}>
                  <BookOpen size={15} />
                  {paperName(id)}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </>
    );
  }
  return (
    <div className="shell">
      {navOpen && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside className={"sidebar " + (navOpen ? "open" : "")}>
        <div className="brand">
          <Orbit className="brandmark" size={36} />
          <span>
            SIG<b>CHI</b>
          </span>
        </div>
        <div className="sideContext">Conference Programs</div>
        <div className="sideConf">
          <img
            src={isStatic() ? "./conference.png" : "/conference.png"}
            alt=""
          />
          <div>
            <b>UIST ’25</b>
            <small>Busan, Korea</small>
          </div>
        </div>
        <nav aria-label="Conference navigation">
          {navigation.map(([n, I], i) => (
            <React.Fragment key={n}>
              {(i === 2 || i === 5) && <hr />}
              <button
                aria-current={page === n ? "page" : undefined}
                onClick={() => navigate(n)}
              >
                <I size={19} />
                {n}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="sideBottom">
          <FlaskConical size={16} /> Hackathon demo · Fictional data
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="row">
            <button
              className="iconBtn mobileMenu"
              aria-label="Open navigation"
              onClick={() => setNavOpen(true)}
            >
              <Menu />
            </button>
            <img
              className="confMark"
              src={isStatic() ? "./conference.png" : "/conference.png"}
              alt=""
            />
            <div>
              <div className="topSmall">Conference Programs</div>
              <strong>UIST ’25</strong>
            </div>
          </div>
          <label className="persona">
            <span>Demo attendee</span>
            <select
              value={viewer}
              disabled={busy}
              aria-label="Switch demo attendee"
              onChange={(e) => switchViewer(e.target.value)}
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </header>
        <div className="canvas">
          <div className="path">
            UIST ’25 <ChevronRight size={13} />
            {page}
          </div>
          <div className="pageHead">
            <div>
              <h1>{page}</h1>
              <p>{captions[page]}</p>
            </div>
            {page === "People" && me && (
              <button
                className="outlined topProfile"
                onClick={() => navigate("My profile")}
              >
                <UserRound size={17} />
                My profile
              </button>
            )}
          </div>
          {error && (
            <div role="alert" className="alert">
              {error}{" "}
              {!view && (
                <button onClick={() => setReload((v) => v + 1)}>Retry</button>
              )}
            </div>
          )}
          {!view ? (
            <div role="status" className="panel record">
              Loading the demo…
            </div>
          ) : (
            <>
              {page === "API examples" ? (
                <div className="panel record api">
                  <h2>Proposed networking API</h2>
                  <p>
                    Inspect the response as{" "}
                    {personas.find((p) => p.id === viewer)?.name}. Change
                    visibility in My profile, then repeat a request as another
                    attendee.
                  </p>
                  <label htmlFor="probe">Request</label>
                  <div className="formRow">
                    <select
                      id="probe"
                      value={probe}
                      onChange={(e) => setProbe(e.target.value)}
                    >
                      <option value="attendees">
                        All visible attendee profiles
                      </option>
                      {personas
                        .filter((x) => x.id !== "guest")
                        .map((p) => (
                          <option key={p.id} value={"attendees/" + p.id}>
                            {p.name}’s profile
                          </option>
                        ))}
                      {sessions.map((s) => (
                        <option key={s.id} value={"attendees?session=" + s.id}>
                          Shared plans · {s.name}
                        </option>
                      ))}
                      {papers.map((p) => (
                        <option key={p.id} value={"attendees?paper=" + p.id}>
                          Shared reading · {p.title}
                        </option>
                      ))}
                    </select>
                    <button className="primary" onClick={runProbe}>
                      Run request
                    </button>
                  </div>
                  <code className="endpoint">
                    GET /api/demo/{prefix}
                    {probe}
                  </code>
                  {trace && (
                    <>
                      <div className="recordHead">
                        <b>Response · HTTP {trace.status}</b>
                        <button
                          className="outlined"
                          onClick={() =>
                            downloadJson("demo-response.json", trace.data)
                          }
                        >
                          <Download size={15} />
                          JSON
                        </button>
                      </div>
                      <code className="endpoint">
                        {trace.method} {trace.path}
                      </code>
                      <pre>{JSON.stringify(trace.data, null, 2)}</pre>
                    </>
                  )}
                  <div className="assetLinks">
                    <a
                      href={
                        (isStatic() ? "./" : "/") +
                        "examples/synthetic-data.json"
                      }
                      download
                    >
                      Download example data
                    </a>
                    <a
                      href={
                        (isStatic() ? "./" : "/") +
                        "examples/requests-and-responses.json"
                      }
                      download
                    >
                      Worked API examples
                    </a>
                    <a
                      href={
                        (isStatic() ? "./" : "/") + "examples/proposed-api.md"
                      }
                      download
                    >
                      API proposal
                    </a>
                  </div>
                  <p className="footnote">{fixtureNote}</p>
                </div>
              ) : !me && page !== "Program" ? (
                <section className="panel empty">
                  <LockKeyhole />
                  <h2>For registered attendees</h2>
                  <p>
                    Switch to Mira or Leo to explore the attendee directory and
                    sharing controls.
                  </p>
                </section>
              ) : page === "People" ? (
                <>
                  <div className="tabs">
                    <button
                      className={tab === "all" ? "active" : ""}
                      onClick={() => setTab("all")}
                    >
                      <Users size={16} />
                      Attendees <i>{external.length}</i>
                    </button>
                    <button
                      className={tab === "matches" ? "active" : ""}
                      onClick={() => setTab("matches")}
                    >
                      <Network size={16} />
                      My matches
                    </button>
                  </div>
                  <div className="directoryLayout">
                    <section>
                      <div className="searchRow">
                        <label className="search">
                          <Search size={18} />
                          <input
                            aria-label="Search attendees"
                            placeholder="Search names or interests"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                          />
                          {q && (
                            <button
                              aria-label="Clear search"
                              onClick={() => setQ("")}
                            >
                              <X size={15} />
                            </button>
                          )}
                        </label>
                        <button
                          className={
                            "outlined " + (filter || authorOnly ? "tinted" : "")
                          }
                          aria-expanded={filtersOpen}
                          onClick={() => setFiltersOpen(!filtersOpen)}
                        >
                          <SlidersHorizontal size={16} />
                          Filters
                        </button>
                      </div>
                      {filtersOpen && (
                        <div className="filterPanel">
                          <label>
                            Paper or session
                            <select
                              value={filter}
                              onChange={(e) => setFilter(e.target.value)}
                            >
                              <option value="">All papers and sessions</option>
                              <optgroup label="Interest in a shared list">
                                {papers.map((p) => (
                                  <option key={p.id} value={"paper:" + p.id}>
                                    {p.title}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Shared session plans">
                                {sessions.map((s) => (
                                  <option key={s.id} value={"session:" + s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </label>
                          <label className="check">
                            <input
                              type="checkbox"
                              checked={authorOnly}
                              onChange={(e) => setAuthorOnly(e.target.checked)}
                            />
                            Linked authors only
                          </label>
                        </div>
                      )}
                      {(filter || authorOnly) && (
                        <button
                          className="clearFilter"
                          onClick={() => {
                            setFilter("");
                            setAuthorOnly(false);
                          }}
                        >
                          <X size={13} />
                          {[filterLabel, authorOnly ? "Linked authors" : ""]
                            .filter(Boolean)
                            .join(" · ")}
                        </button>
                      )}
                      <div className="sectionLine">
                        <h2>
                          {tab === "all"
                            ? "Attendee directory"
                            : "Suggested matches"}
                        </h2>
                        <small>
                          {filtered.length}{" "}
                          {filtered.length === 1 ? "person" : "people"}
                        </small>
                      </div>
                      {tab === "matches" && (
                        <p className="matchExplain">
                          Ranked by shared topics, reading-list papers, and
                          session plans. Open a profile to see the overlap.
                        </p>
                      )}
                      <div className="grid">{filtered.map(card)}</div>
                      {!filtered.length && (
                        <div className="panel empty">
                          <Search />
                          <h3>No matching attendees</h3>
                          <button
                            className="outlined"
                            onClick={() => {
                              setQ("");
                              setFilter("");
                              setAuthorOnly(false);
                              setTab("all");
                            }}
                          >
                            Clear filters
                          </button>
                        </div>
                      )}
                    </section>
                    {myRail()}
                  </div>
                </>
              ) : page === "My lists" ? (
                <div className="reading">{myLists()}</div>
              ) : page === "My profile" && me ? (
                <div className="reading">
                  <section className="panel record">
                    <div className="row">
                      <Avatar name={me.name} color={me.color} large />
                      <div>
                        <h2>{me.name}</h2>
                        <p>{me.affiliation}</p>
                      </div>
                    </div>
                    <div className="setting">
                      <div>
                        <strong>Show my profile to UIST attendees</strong>
                        <p>
                          Other registered attendees can discover your profile
                          and see the lists and session plans you choose to
                          share.
                        </p>
                      </div>
                      <Toggle
                        label="Show my profile to UIST attendees"
                        on={me.profileVisible}
                        change={() => change("profile", !me.profileVisible)}
                        disabled={busy}
                      />
                    </div>
                    <button
                      className="outlined"
                      onClick={() => setPreviewing(true)}
                    >
                      <Eye size={16} />
                      Preview as another attendee
                    </button>
                  </section>
                  <section className="panel record">
                    <h2>Research links</h2>
                    <p>These links follow your profile visibility.</p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        change("links", {
                          website: web.trim(),
                          scholar: scholar.trim(),
                        });
                      }}
                    >
                      <label>
                        Personal website
                        <input
                          type="url"
                          value={web}
                          onChange={(e) => setWeb(e.target.value)}
                          placeholder="https://…"
                        />
                      </label>
                      <label>
                        Google Scholar
                        <input
                          type="url"
                          value={scholar}
                          onChange={(e) => setScholar(e.target.value)}
                          placeholder="https://scholar.google.com/…"
                        />
                      </label>
                      <button className="outlined" disabled={busy}>
                        Save links
                      </button>
                    </form>
                  </section>
                  <section className="panel record">
                    <h2>Lists and session plans</h2>
                    <p>
                      Choose individual lists and sessions to share. A private
                      profile hides them all from other attendees.
                    </p>
                    <div className="formRow">
                      <button
                        className="outlined"
                        onClick={() => navigate("My lists")}
                      >
                        <Bookmark size={16} />
                        My lists
                      </button>
                      <button
                        className="outlined"
                        onClick={() => navigate("Program")}
                      >
                        <CalendarDays size={16} />
                        Session visibility
                      </button>
                    </div>
                  </section>
                </div>
              ) : page === "Program" ? (
                <div className="reading">
                  {sessions.map((s) => {
                    const going = me?.going.includes(s.id) || false,
                      shared = me?.shared.includes(s.id) || false;
                    return (
                      <section key={s.id} className="panel record">
                        <div className="eyebrow">
                          {s.time} <span>·</span> {s.room}
                        </div>
                        <h2>{s.name}</h2>
                        {me && (
                          <div className="sessionControls">
                            <label className="check">
                              <input
                                type="checkbox"
                                checked={going}
                                disabled={busy}
                                onChange={() =>
                                  change("session." + s.id, {
                                    going: !going,
                                    shared: false,
                                  })
                                }
                              />
                              In my plan
                            </label>
                            <label className="check">
                              <Toggle
                                label={"Share my plan for " + s.name}
                                on={shared}
                                disabled={!going || busy}
                                change={() =>
                                  change("session." + s.id, {
                                    going: true,
                                    shared: !shared,
                                  })
                                }
                              />
                              Share my plan
                            </label>
                          </div>
                        )}
                        {me && shared && !me.profileVisible && (
                          <small>Hidden while your profile is private.</small>
                        )}
                        <button
                          className="textBtn"
                          disabled={!me}
                          onClick={() => listFor("session:" + s.id)}
                        >
                          <Users size={15} />
                          See shared session plans
                        </button>
                        <ul className="lines">
                          {s.papers.map((id) => (
                            <li key={id}>
                              <BookOpen size={16} />
                              <div>
                                <strong>{paperName(id)}</strong>
                                {me && (
                                  <button
                                    className="textBtn"
                                    onClick={() => listFor("paper:" + id)}
                                  >
                                    Who is interested?
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              ) : page === "Messages" && me ? (
                <div className="chatLayout">
                  <section className="panel contacts">
                    <h2>Conversations</h2>
                    {external.map((p) => (
                      <button
                        key={p.id}
                        className={thread === p.id ? "selected" : ""}
                        onClick={() => {
                          setThread(p.id);
                          setText("");
                        }}
                      >
                        <Avatar name={p.name} color={p.color} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </section>
                  <section className="panel chat">
                    {thread && external.some((p) => p.id === thread) ? (
                      <>
                        <h2>{external.find((p) => p.id === thread)?.name}</h2>
                        <div className="chatBody">
                          {view.messages.filter(
                            (m) =>
                              m.sender === thread || m.recipient === thread,
                          ).length === 0 && <p>No messages yet.</p>}
                          {view.messages
                            .filter(
                              (m) =>
                                m.sender === thread || m.recipient === thread,
                            )
                            .map((m) => (
                              <div
                                key={m.id}
                                className={
                                  "bubble " +
                                  (m.sender === viewer ? "mine" : "")
                                }
                              >
                                <small>
                                  {m.sender === viewer
                                    ? "You"
                                    : external.find((p) => p.id === thread)
                                        ?.name}
                                </small>
                                {m.body}
                              </div>
                            ))}
                        </div>
                        {!me.profileVisible ? (
                          <div className="inlineNotice">
                            Make your profile visible to start a conversation.{" "}
                            <button
                              className="textBtn"
                              onClick={() => navigate("My profile")}
                            >
                              Open my profile
                            </button>
                          </div>
                        ) : (
                          <form
                            className="formRow"
                            onSubmit={(e) => {
                              e.preventDefault();
                              send();
                            }}
                          >
                            <input
                              aria-label="Message text"
                              value={text}
                              maxLength={1000}
                              onChange={(e) => setText(e.target.value)}
                              placeholder="Write a demo message"
                            />
                            <button
                              className="primary"
                              disabled={busy || !text.trim()}
                            >
                              <Send size={16} />
                              Send
                            </button>
                          </form>
                        )}
                      </>
                    ) : (
                      <div className="empty">
                        <MessagesSquare />
                        <h3>Select an attendee</h3>
                        <p>
                          Switch demo attendees to read and reply as the
                          recipient.
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
      {(profile || previewing) && (
        <Dialog
          title={previewing ? "Attendee preview" : "Attendee profile"}
          close={() => {
            setProfile(null);
            setPreviewing(false);
          }}
        >
          {selected ? (
            <div className="details">
              <Avatar name={selected.name} color={selected.color} large />
              <h2>{selected.name}</h2>
              <p>{selected.affiliation}</p>
              <p className="bio">{selected.bio}</p>
              <div className="chips">
                {selected.topics.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div className="formRow">
                {!previewing && selected.id !== viewer && (
                  <button
                    className="primary"
                    onClick={() => startChat(selected.id)}
                  >
                    <MessagesSquare size={15} />
                    Message
                  </button>
                )}
                <button
                  className="outlined"
                  onClick={() => exportProfile(selected)}
                >
                  <Download size={15} />
                  Download profile
                </button>
              </div>
              {me && !previewing && (
                <section>
                  <h3>What you have in common</h3>
                  {(() => {
                    const m = overlap(me, selected);
                    return (
                      <p>
                        {[
                          ...m.interests,
                          ...m.commonPapers.map(paperName),
                          ...m.commonSessions.map(sessionName),
                        ].join(" · ") || "No shared interests yet."}
                      </p>
                    );
                  })()}
                </section>
              )}
              <section>
                <h3>Research links</h3>
                <div className="links">
                  {selected.links.website && (
                    <a
                      href={selected.links.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Globe size={15} />
                      Website
                    </a>
                  )}
                  {selected.links.scholar && (
                    <a
                      href={selected.links.scholar}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <GraduationCap size={16} />
                      Google Scholar
                    </a>
                  )}
                  {!selected.links.website && !selected.links.scholar && (
                    <small>No links shared.</small>
                  )}
                </div>
              </section>
              {selected.authored.length > 0 && (
                <section>
                  <h3>Authored papers</h3>
                  <p className="hint">
                    ORCID match simulation · {selected.authorKey}
                  </p>
                  <ul className="lines">
                    {selected.authored.map((id) => (
                      <li key={id}>{paperName(id)}</li>
                    ))}
                  </ul>
                </section>
              )}
              <section>
                <h3>Shared lists</h3>
                {selected.lists.length ? (
                  selected.lists.map((l) => (
                    <div key={l.id}>
                      <b>{l.name}</b>
                      <ul className="lines">
                        {l.paperIds.map((id) => (
                          <li key={id}>{paperName(id)}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p>No lists shared.</p>
                )}
              </section>
              <section>
                <h3>Shared session plans</h3>
                {selected.shared.length ? (
                  selected.shared.map((id) => <p key={id}>{sessionName(id)}</p>)
                ) : (
                  <p>No session plans shared.</p>
                )}
              </section>
            </div>
          ) : (
            <div className="empty">
              <LockKeyhole />
              <h2>Private profile</h2>
              <p>Other attendees cannot discover or download this profile.</p>
            </div>
          )}
        </Dialog>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
    </div>
  );
}
