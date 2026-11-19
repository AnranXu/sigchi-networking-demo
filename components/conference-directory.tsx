"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ExternalLink, MapPin, Search } from "lucide-react";
import { conferences, type DemoConference } from "../lib/conferences";

export function ConferencePortals({
  openDirectory,
  disabled,
}: {
  openDirectory: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function outside(e: PointerEvent) {
      if (!container.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function showDirectory(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setOpen(false);
    openDirectory();
  }
  return (
    <div
      className={"portalBrand" + (open ? " portalsOpen" : "")}
      ref={container}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setOpen(false);
      }}
      onKeyDown={(e) => {
        if (open && e.key === "Escape") {
          e.stopPropagation();
          e.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <div className="brand">
        <button
          type="button"
          ref={trigger}
          className="portalTrigger"
          aria-label="Portals"
          title="Choose a conference or SIGCHI portal"
          aria-controls="portal-menu"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <span className="portalDots" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        </button>
        <a
          className="portalLogo"
          href="#conferences"
          onClick={showDirectory}
          aria-label="Back to conference list"
        >
          <img src="./sigchi.svg" alt="SIGCHI" />
        </a>
      </div>
      <section
        id="portal-menu"
        className="portalLinks"
        aria-label="Portals"
        hidden={!open}
      >
        <h2>Portals</h2>
        <a href="#conferences" onClick={showDirectory}>
          <span aria-hidden="true">P</span>Conference Programs
        </a>
        <a href="https://services.sigchi.org/" target="_blank" rel="noreferrer">
          <span aria-hidden="true">Q</span>QOALA
        </a>
        <a href="https://sigchi.org/" target="_blank" rel="noreferrer">
          <span aria-hidden="true">S</span>SIGCHI.org
        </a>
      </section>
    </div>
  );
}

type Entry = {
  short: string;
  year: number;
  name: string;
  title: string;
  dates: string;
  location: string;
  logo: string;
  url: string;
  demo?: string;
  start: number;
};
type Published = {
  conference: {
    shortName: string;
    year: number;
    name?: string;
    fullName?: string;
    startDate: number;
    endDate: number;
    location?: string;
    logoUrl?: string;
  };
  publicationInfo: { publicationStatus: string };
};
const catalogUrl = "https://files.sigchi.org/conference/cache/program-list";
const dates = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const demoEntries: Entry[] = conferences.map((c) => ({
  short: "CHI",
  year: c.year,
  name: "CHI " + c.year,
  title: "ACM CHI Conference on Human Factors in Computing Systems",
  dates: c.dates,
  location: c.location,
  logo: "./" + c.logo,
  url: "#program/" + c.id,
  demo: c.id,
  start: 0,
}));
function officialEntries(records: Published[]): Entry[] {
  return records
    .filter(
      ({ conference: c, publicationInfo }) =>
        publicationInfo?.publicationStatus === "PUBLISHED" &&
        c?.shortName &&
        Number.isInteger(c.year) &&
        Number.isFinite(c.startDate) &&
        Number.isFinite(c.endDate) &&
        !demoEntries.some((d) => d.short === c.shortName && d.year === c.year),
    )
    .map(({ conference: c }) => ({
      short: c.shortName,
      year: c.year,
      name: c.name || c.shortName + " " + c.year,
      title: c.fullName || "",
      dates: dates.format(c.startDate) + " – " + dates.format(c.endDate),
      location: c.location || "",
      logo: c.logoUrl?.startsWith("https://files.sigchi.org/conference/logo/")
        ? c.logoUrl
        : "",
      url:
        "https://programs.sigchi.org/" +
        encodeURIComponent(c.shortName.toLowerCase()) +
        "/" +
        c.year,
      start: c.startDate,
    }))
    .sort(
      (a, b) =>
        b.year - a.year || b.start - a.start || a.name.localeCompare(b.name),
    );
}
function normalized(text: string) {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .trim();
}

export function ConferenceDirectory({
  active,
  select,
}: {
  active: DemoConference;
  select: (id: string) => void;
}) {
  const [entries, setEntries] = useState<Entry[]>([]),
    [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState(""),
    [short, setShort] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    const controller = new AbortController(),
      timeout = window.setTimeout(() => controller.abort(), 10000);
    setStatus("loading");
    fetch(catalogUrl, {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    })
      .then((res) => {
        if (!res.ok) throw Error();
        return res.json();
      })
      .then((data) => {
        if (live) {
          if (!Array.isArray(data)) throw Error("Invalid conference list");
            setEntries(officialEntries(data));
          setStatus("ready");
        }
      })
      .catch(() => {
        if (live) setStatus("error");
      });
    return () => {
      live = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);
  const names = useMemo(
    () =>
      [...new Set([...demoEntries, ...entries].map((c) => c.short))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [entries],
  );
  const terms = normalized(query).split(/\s+/).filter(Boolean);
  function matches(e: Entry) {
    const search = normalized(
      [
        e.name,
        e.title,
        e.short,
        e.year,
        e.short + " " + String(e.year).slice(-2),
        e.location,
      ].join(" "),
    );
    return (
      (!short || short === e.short) && terms.every((t) => search.includes(t))
    );
  }
  const demo = demoEntries.filter(matches),
    official = entries.filter(matches);
  function card(c: Entry) {
    return (
      <li key={c.url}>
        <a
          className="conferenceCard"
          href={c.url}
          target={c.demo ? undefined : "_blank"}
          rel={c.demo ? undefined : "noreferrer"}
          aria-current={c.demo === active.id ? "true" : undefined}
          onClick={(e) => {
            if (
              c.demo &&
              !e.metaKey &&
              !e.ctrlKey &&
              !e.shiftKey &&
              !e.altKey
            ) {
              e.preventDefault();
              select(c.demo);
            }
          }}
        >
          <span className="directoryLogo">
            {c.logo ? (
              <img
                loading="lazy"
                alt=""
                referrerPolicy="no-referrer"
                src={c.logo}
                onError={(e) => {
                  e.currentTarget.hidden = true;
                }}
              />
            ) : null}
          </span>
          <span className="directoryMeta">
            <strong>
              {c.name}
              {c.title && c.title !== c.name && <span> · {c.title}</span>}
            </strong>
            <span>
              <CalendarDays size={15} aria-hidden="true" />
              {c.dates}
            </span>
            {c.location && (
              <span>
                <MapPin size={15} aria-hidden="true" />
                {c.location}
              </span>
            )}
          </span>
          {c.demo === active.id ? (
            <small>Current conference</small>
          ) : (
            !c.demo && (
              <ExternalLink
                size={16}
                aria-label="Opens official program in a new tab"
              />
            )
          )}
        </a>
      </li>
    );
  }
  return (
    <div className="conferenceDirectory">
      <div className="catalogFilters">
        <label className="catalogSearch">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search conferences"
            placeholder="Search conference by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Conference short name"
          value={short}
          onChange={(e) => setShort(e.target.value)}
        >
          <option value="">Conference short name</option>
          {names.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </div>
      {demo.length > 0 && (
        <section>
          <h2>Demo conferences</h2>
          <ul>{demo.map(card)}</ul>
        </section>
      )}
      {status === "loading" && (
        <p role="status">Loading other SIGCHI conferences…</p>
      )}
      {status === "error" && (
        <p role="status">
          Couldn’t load other conferences.{" "}
          <button
            type="button"
            className="textBtn"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </button>{" "}
          ·{" "}
          <a
            href="https://programs.sigchi.org/"
            target="_blank"
            rel="noreferrer"
          >
            Open SIGCHI Programs
          </a>
        </p>
      )}
      {official.length > 0 && (
        <section>
          <h2>Official SIGCHI programs</h2>
          {[...new Set(official.map((e) => e.year))].map((year) => (
            <div key={year}>
              <h3>{year}</h3>
              <ul>{official.filter((e) => e.year === year).map(card)}</ul>
            </div>
          ))}
        </section>
      )}
      {!demo.length && !official.length && status === "ready" && (
        <p role="status">
          No conferences found.{" "}
          <button
            className="textBtn"
            type="button"
            onClick={() => {
              setQuery("");
              setShort("");
            }}
          >
            Clear filters
          </button>
        </p>
      )}
    </div>
  );
}
