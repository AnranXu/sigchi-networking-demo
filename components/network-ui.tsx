"use client";
import React, { useState, useEffect, useRef, type ReactNode } from "react";
import {
  Users,
  UserRound,
  CalendarDays,
  MapPin,
  Link2,
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
import {
  sessions,
  papers,
  personas as seedViewers,
  rooms,
  fixtureNote,
} from "@/lib/demo-fixtures";
import {
  overlap,
  permits,
  audienceName,
  publicProfile,
  type Audience,
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
import { roomFromHash } from "../lib/room-identification";
import { Research } from "./research";
import PeopleBrowser from "./people-browser";
import {
  AudienceControl,
  ProfileDisclosure,
  CheckInPanel,
  CreateProfile,
} from "./sharing";
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
type Trace = { method: string; path: string; status: number; data: any };
export default function NetworkUI() {
  const [viewer, setViewer] = useState("guest"),
    [view, setView] = useState<View | null>(null),
    [page, setPage] = useState<Page>("People");
  const [tab, setTab] = useState("all"),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState("");
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
  const personas = view?.identities || seedViewers;
  const [phoneSearch, setPhoneSearch] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [incomingRoom, setIncomingRoom] = useState<string | null>(null),
    [prefilledRoom, setPrefilledRoom] = useState<string | null>(null);
  useEffect(() => {
    function readLink() {
      const name = roomFromHash(window.location.hash);
      if (name) setIncomingRoom(name);
    }
    readLink();
    window.addEventListener("hashchange", readLink);
    return () => window.removeEventListener("hashchange", readLink);
  }, []);
  useEffect(() => {
    if (!incomingRoom || view?.own?.id !== viewer) return;
    setPage("My profile");
    setRoomOpen(true);
    setPrefilledRoom(incomingRoom);
    setIncomingRoom(null);
    if (roomFromHash(window.location.hash) === incomingRoom)
      history.replaceState(
        history.state,
        "",
        window.location.pathname + window.location.search,
      );
  }, [incomingRoom, view?.own?.id, viewer]);
  const [previewViewer, setPreviewViewer] = useState("carla");
  const mobileMenu = useRef<HTMLButtonElement>(null),
    sideNav = useRef<HTMLElement>(null),
    pageTitle = useRef<HTMLHeadingElement>(null);
  function closeMobile() {
    setNavOpen(false);
    requestAnimationFrame(() => mobileMenu.current?.focus());
  }
  useEffect(() => {
    if (!navOpen) return;
    const mq = window.matchMedia("(min-width:991px)");
    const close = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener("change", close);
    sideNav.current?.querySelector<HTMLButtonElement>(".mobileClose")?.focus();
    return () => mq.removeEventListener("change", close);
  }, [navOpen]);
  const generation = useRef(0);
  useEffect(() => {
    try {
      const s = localStorage.getItem("sigchi.chi26.persona");
      if (
        s &&
        (seedViewers.some((p) => p.id === s) ||
          /^member-[a-f0-9-]{36}$/.test(s))
      )
        setViewer(s);
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
      if (id === generation.current) {
        if (viewer.startsWith("member-") && e.message.includes("registered"))
          switchViewer("guest");
        else setError(e.message);
      }
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
      if (e.key === "sigchi-networking-chi26.v2") {
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
  useEffect(() => {
    if (!view) return;
    const deadlines = [
      view.own?.checkIn,
      ...view.directory.map((p) => p.checkIn),
    ]
      .flatMap((c) => (c ? [c.expiresAt] : []))
      .filter((t) => t > Date.now());
    if (!deadlines.length) return;
    let live = true;
    const t = setTimeout(
      () => {
        loadView(viewer)
          .then((v) => {
            if (live) setView(v);
          })
          .catch(() => {});
      },
      Math.max(0, Math.min(...deadlines) - Date.now() + 10),
    );
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [view, viewer]);
  const me = view?.own;
  const directory = view?.directory || [];
  const external = directory.filter((p) => p.id !== viewer);
  const recipients = personas.filter(
    (p) => p.id !== viewer && p.id !== "guest",
  );
  function switchViewer(id: string) {
    setPrefilledRoom(null);
    setRoomOpen(false);
    setViewer(id);
    localStorage.setItem("sigchi.chi26.persona", id);
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
  async function createProfile(name: string, audience: Audience) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await callApi<{ id: string; error?: string }>(
        prefix + "profiles",
        viewer,
        "POST",
        { name, audience },
      );
      if (r.status !== 201)
        throw Error(r.data.error || "Could not create profile.");
      switchViewer(r.data.id);
      navigate("People");
      setNotice("Your profile is ready");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function navigate(p: Page) {
    setPrefilledRoom(null);
    setRoomOpen(false);
    requestAnimationFrame(() => pageTitle.current?.focus());
    setPage(p);
    setNavOpen(false);
    setThread(null);
    setProfile(null);
    setPreviewing(false);

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
  }
  const previewAs =
    previewViewer === viewer
      ? personas.find((p) => p.id !== viewer && p.id !== "guest")?.id || "guest"
      : previewViewer;
  const selected = previewing
    ? me && permits(me.rules.profile, previewAs)
      ? publicProfile(me, previewAs)
      : undefined
    : directory.find((p) => p.id === profile);
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
            </div>
            <details className="listSharing">
              <summary>
                Sharing · {audienceName(me.rules["list." + l.id])}
              </summary>
              <AudienceControl
                label={"Who can see " + l.name + "?"}
                rule={me.rules["list." + l.id]}
                people={recipients}
                busy={busy}
                save={(a) => change("audience.list." + l.id, a)}
              />
              {me.rules.profile.mode !== "attendees" && (
                <p className="hint">
                  {me.profileVisible
                    ? "Your profile audience also applies to this list."
                    : "This list is hidden while your profile is private."}
                </p>
              )}
            </details>
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
      <a className="skipLink" href="#main-content">
        Skip to main content
      </a>
      {navOpen && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      )}
      <aside
        ref={sideNav}
        role={navOpen ? "dialog" : undefined}
        aria-modal={navOpen ? true : undefined}
        aria-label="Conference menu"
        className={"sidebar " + (navOpen ? "open" : "")}
        onKeyDown={(e) => {
          if (!navOpen) return;
          if (e.key === "Escape") {
            e.preventDefault();
            closeMobile();
          }
          if (e.key === "Tab") {
            const items = Array.from(
              sideNav.current!.querySelectorAll<HTMLElement>(
                "a[href],button:not(:disabled)",
              ),
            );
            const first = items[0],
              last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <button
          className="mobileClose iconBtn"
          aria-label="Close menu"
          onClick={closeMobile}
        >
          <X />
        </button>
        <div className="brand">
          <span aria-hidden="true">⠿</span>
          <img alt="SIGCHI" src={isStatic() ? "./sigchi.svg" : "/sigchi.svg"} />
        </div>
        <button className="sideUser" onClick={() => navigate("My profile")}>
          <UserRound size={19} />
          {me?.name || "Create profile"}
        </button>
        <a
          className="confHome"
          href="https://chi2026.acm.org/"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={isStatic() ? "./conference.png" : "/conference.png"}
            alt=""
          />
          CHI 2026 Home
        </a>
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
          <FlaskConical size={16} /> Hackathon prototype
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} inert={navOpen || undefined}>
        <header className="topbar">
          <div className="row">
            <button
              className="iconBtn mobileMenu"
              ref={mobileMenu}
              aria-expanded={navOpen}
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
              <div className="topSmall">
                Barcelona, Spain · April 13–17, 2026 · CEST
              </div>
              <h1 ref={pageTitle} tabIndex={-1}>
                CHI ’26 {page}
              </h1>
            </div>
          </div>
          <label className="persona">
            <UserRound size={19} aria-hidden="true" />
            <span>View as</span>
            <select
              value={viewer}
              disabled={busy}
              aria-label="View as demo attendee"
              onChange={(e) => {
                if (e.target.value === "new") {
                  switchViewer("guest");
                  navigate("My profile");
                } else switchViewer(e.target.value);
              }}
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="new">Create a new profile…</option>
            </select>
          </label>
          {page === "People" && me && (
            <button
              className="phoneSearchBtn iconBtn"
              aria-label="Search people"
              aria-expanded={phoneSearch}
              onClick={() => setPhoneSearch((v) => !v)}
            >
              <Search />
            </button>
          )}
        </header>
        <div className="canvas">
          <div className="demoContext">
            <span>
              Hackathon demo · Public research profiles · Simulated plans and
              room check-ins.
            </span>
            {me && page !== "My profile" && (
              <button
                className="textBtn"
                onClick={() => navigate("My profile")}
              >
                My sharing settings
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
                      {rooms.map((r) => (
                        <option
                          key={r}
                          value={"attendees?room=" + encodeURIComponent(r)}
                        >
                          Current check-ins · {r}
                        </option>
                      ))}
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
                <div className="joinWrap">
                  {incomingRoom && (
                    <p className="captureResult">
                      Room QR · {incomingRoom}. Create a profile or choose a
                      demo attendee to check in.
                    </p>
                  )}
                  <CreateProfile
                    onCreate={createProfile}
                    people={recipients}
                    busy={busy}
                  />
                  <p>
                    To explore an existing example, choose a name under{" "}
                    <b>View as</b>.
                  </p>
                </div>
              ) : page === "People" && me ? (
                <PeopleBrowser
                  phoneSearch={phoneSearch}
                  me={me}
                  people={external}
                  tab={tab}
                  setTab={setTab}
                  filter={filter}
                  setFilter={setFilter}
                  open={setProfile}
                  manage={() => {
                    navigate("My profile");
                    setRoomOpen(true);
                  }}
                  query={q}
                  setQuery={setQ}
                />
              ) : page === "My lists" ? (
                <div className="reading">{myLists()}</div>
              ) : page === "My profile" && me ? (
                <div className="reading simpleProfile" key={me.id}>
                  <section className="panel profileMain">
                    <div className="profileIdentity">
                      <Avatar name={me.name} color={me.color} large />
                      <div>
                        <h2>{me.name}</h2>
                        {me.affiliation && <p>{me.affiliation}</p>}
                      </div>
                    </div>
                    <AudienceControl
                      primary
                      label="Who can see my profile?"
                      rule={me.rules.profile}
                      people={recipients}
                      busy={busy}
                      save={(a) => change("audience.profile", a)}
                    />
                    <p className="sharingExplanation">
                      {me.rules.profile.mode === "private"
                        ? "Your profile and anything you share are hidden from other attendees."
                        : me.rules.profile.mode === "selected"
                          ? "Only the people you choose can see your profile and anything you share."
                          : "Registered attendees can find your profile. You choose which lists, plans and check-ins to share."}
                    </p>
                    <button
                      className="textBtn"
                      onClick={() => setPreviewing(true)}
                    >
                      <Eye size={16} />
                      Preview as another attendee
                    </button>
                  </section>
                  <section
                    className="panel profileExtras"
                    aria-label="Optional profile settings"
                  >
                    <ProfileDisclosure
                      title="Current room"
                      status={
                        me.checkIn ? me.checkIn.room : "No active check-in"
                      }
                      icon={<MapPin size={19} />}
                      open={roomOpen}
                      onToggle={(open) => {
                        setRoomOpen(open);
                        if (!open) setPrefilledRoom(null);
                      }}
                    >
                      {roomOpen && (
                        <CheckInPanel
                          key={prefilledRoom || me.id}
                          prefilledRoom={prefilledRoom}
                          me={me}
                          people={recipients}
                          change={change}
                          busy={busy}
                        />
                      )}
                    </ProfileDisclosure>
                    <ProfileDisclosure
                      title="Research links"
                      icon={<Link2 size={19} />}
                    >
                      <form
                        className="linksForm"
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
                      <AudienceControl
                        label="Who can see my research links?"
                        rule={me.rules.links}
                        people={recipients}
                        busy={busy}
                        save={(a) => change("audience.links", a)}
                      />
                    </ProfileDisclosure>
                    {seedViewers.some((p) => p.id === me.id) && (
                      <ProfileDisclosure
                        title="Research and publications"
                        icon={<BookOpen size={19} />}
                      >
                        <Research id={me.id} />
                      </ProfileDisclosure>
                    )}
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
                            {going && (
                              <AudienceControl
                                label="Who can see this plan?"
                                rule={me.rules["session." + s.id]}
                                people={recipients}
                                busy={busy}
                                save={(a) =>
                                  change("audience.session." + s.id, a)
                                }
                              />
                            )}
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
                        </button>{" "}
                        <button
                          className="textBtn"
                          disabled={!me}
                          onClick={() => listFor("room:" + s.room)}
                        >
                          Who is here now?
                        </button>
                        <ul className="lines">
                          {s.papers.map((id) => (
                            <li key={id}>
                              <BookOpen size={16} />
                              <div>
                                <strong>
                                  <a
                                    href={papers.find((p) => p.id === id)?.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {paperName(id)}
                                  </a>
                                </strong>
                                <details className="paperInfo">
                                  <summary>Authors and publication</summary>
                                  <p>
                                    {papers
                                      .find((p) => p.id === id)
                                      ?.authorNames.join(", ")}
                                  </p>
                                  <a
                                    href={papers.find((p) => p.id === id)?.doi}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {papers.find((p) => p.id === id)?.track} ·
                                    DOI
                                  </a>
                                </details>
                                {me && (
                                  <button
                                    className="textBtn"
                                    disabled={busy}
                                    onClick={() => {
                                      const ids = me.lists[0].paperIds;
                                      change(
                                        "papers.reading",
                                        ids.includes(id)
                                          ? ids.filter((v) => v !== id)
                                          : [...ids, id],
                                      );
                                    }}
                                  >
                                    <Bookmark size={14} />
                                    {me.lists[0].paperIds.includes(id)
                                      ? "Remove from reading list"
                                      : "Save to reading list"}
                                  </button>
                                )}
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
          {previewing && (
            <label className="previewWho">
              Preview as
              <select
                aria-label="Preview audience member"
                value={previewAs}
                onChange={(e) => setPreviewViewer(e.target.value)}
              >
                {personas
                  .filter((p) => p.id !== viewer)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {selected ? (
            <div className="details">
              <Avatar name={selected.name} color={selected.color} large />
              <h2>{selected.name}</h2>
              <p>{selected.affiliation}</p>
              {selected.checkIn && (
                <div className="checkStatus">
                  <b>Current room</b> · {selected.checkIn.room} · until{" "}
                  {new Date(selected.checkIn.expiresAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}

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
                  onClick={() =>
                    previewing
                      ? downloadJson(
                          selected.id + "-as-" + previewAs + ".json",
                          { conferenceId: "chi26-demo", profile: selected },
                        )
                      : exportProfile(selected)
                  }
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
              {selected.links.website || selected.links.scholar ? (
                <Research id={selected.id} />
              ) : (
                <p>{selected.bio}</p>
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
              <p>This viewer cannot discover or download this profile.</p>
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
