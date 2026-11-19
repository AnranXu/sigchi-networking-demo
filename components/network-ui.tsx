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
  Presentation,
} from "lucide-react";
import {
  personas as seedViewers,
  fixtureNote,
  profileAffiliation,
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
import { callApi, loadView, downloadJson, isStatic } from "@/lib/client-api";
import {
  conferences,
  defaultConference,
  conferencePrefix,
  type DemoConference,
} from "../lib/conferences";
import { roomFromHash } from "../lib/room-identification";
import { ConferenceDirectory, ConferencePortals } from "./conference-directory";
import { RoomBadge, RoomStatusPage } from "./room-status";
import { SessionReminders } from "./session-reminders";
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
  | "Rooms"
  | "My lists"
  | "My profile"
  | "Messages"
  | "All Conferences"
  | "API examples";
const navigation: [Page, typeof Users][] = [
  ["Program", CalendarDays],
  ["Rooms", MapPin],
  ["People", Users],
  ["My lists", Bookmark],
  ["My profile", UserRound],
  ["Messages", MessagesSquare],
  ["All Conferences", Presentation],
  ["API examples", Code2],
];
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
function programFromHash(hash: string) {
  return conferences.find(c => hash === "#program/" + c.id);
}
function pageFromHistory(): Page | undefined {
  return navigation.find(([name]) => name === history.state?.pickerPage)?.[0];
}
type Trace = { method: string; path: string; status: number; data: any };
export default function NetworkUI() {
  const [event, setEvent] = useState<DemoConference | null>(null);
  const [name, setName] = useState("");
  const [initialPage, setInitialPage] = useState<Page>("People");
  useEffect(() => {
    const fromLink = () => {
      const hash = window.location.hash;
      const program = programFromHash(hash);
      const next = program || (roomFromHash(hash) && defaultConference)
        || conferences.find(c => c.id === history.state?.pickerEventId)
        || conferences.find(c => c.id === localStorage.getItem("sigchi.conference")) || defaultConference;
      setInitialPage(program ? "Program" : hash === "#conferences" ? "All Conferences" : pageFromHistory() || "People");
      setEvent(next);
      localStorage.setItem("sigchi.conference", next.id);
    };
    fromLink();
    window.addEventListener("hashchange", fromLink);
    window.addEventListener("popstate", fromLink);
    return () => { window.removeEventListener("hashchange", fromLink); window.removeEventListener("popstate", fromLink); };
  }, []);
  function selectEvent(id: string, destination: Page = "My profile") {
    const next = conferences.find((c) => c.id === id);
    if (!next) return;
    if (!next.roomReaders && roomFromHash(window.location.hash)) {
      history.replaceState(history.state, "", window.location.pathname + window.location.search);
    }
    if (destination === "My profile") history.replaceState({ ...history.state, pickerEventId: id, pickerPage: destination }, "");
    setInitialPage(destination);
    localStorage.setItem("sigchi.conference", id);
    setEvent(next);
  }
  return event ? (
    <ConferenceUI
      key={event.id}
      event={event}
      selectEvent={selectEvent}
      initialPage={initialPage}
      signupName={name}
      setSignupName={setName}
    />
  ) : null;
}

function ConferenceUI({
  event,
  selectEvent,
  initialPage,
  signupName,
  setSignupName,
}: {
  event: DemoConference;
  selectEvent: (id: string, destination?: Page) => void;
  initialPage: Page;
  signupName: string;
  setSignupName: (name: string) => void;
}) {
  const { papers, sessions, rooms } = event;
  const prefix = conferencePrefix(event.id);
  const focusConference = useRef(initialPage === "My profile");
  const paperName = (id: string) =>
    papers.find((p) => p.id === id)?.title || id;
  const sessionName = (id: string) =>
    sessions.find((s) => s.id === id)?.name || id;
  useEffect(() => {
    document.title = event.name + " Programs · Networking demo";
  }, [event]);
  const [viewer, setViewer] = useState("guest"),
    [view, setView] = useState<View | null>(null),
    [page, setPage] = useState<Page>(initialPage);
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
  const [selectedRoom, setSelectedRoom] = useState("");
  const [roomOpen, setRoomOpen] = useState(false);
  const [incomingRoom, setIncomingRoom] = useState<string | null>(null),
    [prefilledRoom, setPrefilledRoom] = useState<string | null>(null);
  useEffect(() => {
    function readLink() {
      const hash = window.location.hash;
      const target = hash === "#conferences" ? "All Conferences" : programFromHash(hash) ? "Program" : !hash ? pageFromHistory() : undefined;
      if (target) { setPage(target); setNavOpen(false); setProfile(null); setPreviewing(false); }
      if (window.location.hash === "#reminders") setPage("My lists");
      if (window.location.hash === "#rooms") setPage("Rooms");
      const name = roomFromHash(window.location.hash);
      if (event.roomReaders && name) setIncomingRoom(name);
    }
    readLink();
    window.addEventListener("hashchange", readLink);
    window.addEventListener("popstate", readLink);
    return () => { window.removeEventListener("hashchange", readLink); window.removeEventListener("popstate", readLink); };
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
      const data = await loadView(viewer, event.id);
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
        const d = await loadView(viewer, event.id);
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
    if (view.roomBoard.refreshAt) deadlines.push(view.roomBoard.refreshAt);
    if (!deadlines.length) return;
    let live = true;
    const t = setTimeout(
      () => {
        loadView(viewer, event.id)
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
  useEffect(() => {
    if (page !== "Rooms" || busy || viewer === "guest" || isStatic()) return;
    let active = true;
    let pending = false;
    async function refreshRooms() {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const res = await callApi<View["roomBoard"]>(prefix + "rooms", viewer);
        if (active && res.status === 200) setView(old => old?.viewer === viewer ? { ...old, roomBoard: res.data } : old);
      } catch { /* Keep the last reading until the next refresh. */ }
      finally { pending = false; }
    }
    const timer = window.setInterval(refreshRooms, 30_000);
    window.addEventListener("focus", refreshRooms);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refreshRooms); };
  }, [page, busy, viewer, prefix]);
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
      setSignupName("");
      switchViewer(r.data.id);
      navigate(window.location.hash === "#reminders" ? "My lists" : "People");
      setNotice("Your profile is ready");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function openDirectory() {
    if (busy) return;
    if (window.location.hash !== "#conferences") {
      history.replaceState({ ...history.state, pickerEventId: event.id, pickerPage: page }, "");
      history.pushState({ pickerEventId: event.id, pickerPage: "All Conferences" }, "", "#conferences");
    }
    navigate("All Conferences");
  }
  function openProgram(id: string) {
    if (busy) return;
    history.pushState({ pickerEventId: id, pickerPage: "Program" }, "", "#program/" + id);
    selectEvent(id, "Program");
    navigate("Program");
  }
  function navigate(p: Page) {
    const hash = window.location.hash;
    if ((p !== "My lists" && hash === "#reminders") || (p !== "Rooms" && hash === "#rooms") || (p !== "All Conferences" && hash === "#conferences") || (p !== "Program" && programFromHash(hash))) {
      history.replaceState({ ...history.state, pickerEventId: event.id, pickerPage: p }, "", window.location.pathname + window.location.search);
    } else if (history.state?.pickerPage && !hash) {
      history.replaceState({ ...history.state, pickerEventId: event.id, pickerPage: p }, "");
    }
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
  function change(field: string, value: unknown) {
    return savePreference("me/sharing", { field, value });
  }
  async function savePreference(route: string, body: unknown, confirmation = "Changes saved for " + event.name) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await request(route, "PATCH", body);
      if (r.status >= 400) throw Error(r.data.error);
      setView(await loadView(viewer, event.id));
      setNotice(confirmation);
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
      ? publicProfile(me, previewAs, event)
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
      setView(await loadView(viewer, event.id));
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
  const conferencePicker = (
    <label className="conferencePicker">
      <span id="conference-picker-label">Conference</span>
      <select
        aria-labelledby="conference-picker-label"
        value={event.id}
        onChange={(e) => selectEvent(e.target.value)}
        disabled={busy}
        ref={(node) => {
          if (node && focusConference.current) {
            node.focus();
            focusConference.current = false;
          }
        }}
      >
        {conferences.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} · {c.city}
          </option>
        ))}
      </select>
    </label>
  );
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
        <ConferencePortals key={navOpen ? "mobile-open" : "nav"} openDirectory={openDirectory} disabled={busy} />
        <button className="sideUser" onClick={() => navigate("My profile")}>
          <UserRound size={19} />
          {me?.name || "Create profile"}
        </button>
        <a
          className="confHome"
          href={event.home}
          target="_blank"
          rel="noreferrer"
        >
          <img src={(isStatic() ? "./" : "/") + event.logo} alt="" />
          CHI {event.year} Home
        </a>
        <nav aria-label="Conference navigation">
          {navigation.map(([n, I]) => (
            <React.Fragment key={n}>
              {(n === "My lists" || n === "All Conferences") && <hr />}
              <button
                aria-current={page === n ? "page" : undefined}
                onClick={() => n === "All Conferences" ? openDirectory() : navigate(n)}
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
        <header className={"topbar" + (page === "All Conferences" ? " catalogHeader" : "")}>
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
              src={(isStatic() ? "./" : "/") + event.logo}
              alt=""
            />
            <div>
              <div className="topSmall">
                {event.location} · {event.dates} · {event.zone}
              </div>
              <h1 ref={pageTitle} tabIndex={-1}>
                {page === "All Conferences" ? page : event.name + " " + page}
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
          {page !== "All Conferences" && <div className="demoContext">
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
          </div>}
          {error && (
            <div role="alert" className="alert">
              {error}{" "}
              {!view && (
                <button onClick={() => setReload((v) => v + 1)}>Retry</button>
              )}
            </div>
          )}
          {view?.viewer === viewer && (
            <SessionReminders
              key={viewer} event={event} me={view.own} showControls={page === "My lists"}
              busy={busy} tryAttendee={() => switchViewer("carla")}
              chooseSession={() => {
                navigate("Program");
                requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".sessionControls input[type=checkbox]")?.focus());
              }}
              setMinutes={minutesBefore => savePreference("me/reminders", { minutesBefore })}
            />
          )}
          {page === "All Conferences" ? <ConferenceDirectory active={event} select={openProgram} /> : !view ? (
            <div role="status" className="panel record">
              Loading the demo…
            </div>
          ) : (
            <>
              {page === "API examples" ? (
                <div className="panel record api">
                  <h2>What do we need from the SIGCHI API?</h2>
                  <p>
                    These examples show what {personas.find((p) => p.id === viewer)?.name} can see at {event.name}.
                    Try another attendee to see how sharing works.
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
                      <option value="rooms">Room status and capacity</option>
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
                      CHI ’26 example data
                    </a>
                    <a
                      href={
                        (isStatic() ? "./" : "/") +
                        "examples/requests-and-responses.json"
                      }
                      download
                    >
                      CHI ’26 worked examples
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
              ) : page === "Rooms" ? (
                <RoomStatusPage board={view.roomBoard} selected={selectedRoom} select={setSelectedRoom} signedIn={!!me} busy={busy}
                  tryAttendee={() => switchViewer("carla")}
                  checkIn={room => { navigate("My profile"); setPrefilledRoom(room); setRoomOpen(true); }}
                  report={(room,status) => savePreference("rooms/report", { room, status }, status ? "Room report saved" : "Room report removed")}
                  move={room => savePreference("rooms/demo-badge", { room }, "Demo badge location updated")}
                />
              ) : !me && page !== "Program" ? (
                <div className="joinWrap">
                  {incomingRoom && (
                    <p className="captureResult">
                      Room QR · {incomingRoom}. Create a profile or choose a
                      demo attendee to check in.
                    </p>
                  )}
                  <CreateProfile
                    conferencePicker={conferencePicker}
                    name={signupName}
                    setName={setSignupName}
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
                  event={event}
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
                        {me.affiliation && <p>{profileAffiliation(me)}</p>}
                      </div>
                    </div>
                    {conferencePicker}
                    <AudienceControl
                      primary
                      label="Who can see my profile at this conference?"
                      rule={me.rules.profile}
                      people={recipients}
                      busy={busy}
                      save={(a) => change("audience.profile", a)}
                    />
                    <p className="sharingExplanation">
                      {me.rules.profile.mode === "private"
                        ? "Your profile, lists, plans, and room are private at " +
                          event.name +
                          "."
                        : me.rules.profile.mode === "selected"
                          ? "Only the people you choose at " +
                            event.name +
                            " can see what you share."
                          : "People at " +
                            event.name +
                            " can see your profile. You choose whether to share your lists, plans, or room."}
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
                          event={event}
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
                        <Research event={event} id={me.id} />
                      </ProfileDisclosure>
                    )}
                  </section>
                </div>
              ) : page === "Program" ? (
                <div className="reading">
                  {me && <button className="textBtn programListsLink" onClick={() => navigate("My lists")}><Bookmark size={16} aria-hidden="true" />My lists and reminders</button>}
                  {sessions.map((s) => {
                    const going = me?.going.includes(s.id) || false,
                      shared = me?.shared.includes(s.id) || false;
                    return (
                      <section key={s.id} className="panel record">
                        <div className="eyebrow">
                          {s.time} <span>·</span> {s.room}
                        </div>
                        <h2>{s.name}</h2>
                        <button type="button" className="programRoomStatus" onClick={() => { setSelectedRoom(s.room); navigate("Rooms"); }} aria-label={"Room status for " + s.room}>
                          <span>Room now</span><RoomBadge status={view.roomBoard.rooms.find(r => r.room === s.room)?.status ?? "unknown"}/>
                        </button>
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
          title={(previewing ? "Attendee preview" : "Attendee profile") + " · " + event.name}
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
              <p>{profileAffiliation(selected)}</p>
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
                          { conferenceId: event.id, profile: selected },
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
                <Research event={event} id={selected.id} />
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
