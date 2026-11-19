"use client";
import React, { useState } from "react";
import { MapPin, SlidersHorizontal, Search } from "lucide-react";
import { profileAffiliation } from "../lib/demo-fixtures";
import { overlap, type DemoPerson, type Profile } from "../lib/network-model";
import type { DemoConference } from "../lib/conferences";
const tabs = [
  ["all", "People"],
  ["affiliations", "Affiliations"],
  ["matches", "My matches"],
  ["now", "Here now"],
];
const surname = (p: Profile) => p.name.trim().split(/\s+/).at(-1) || p.name;
type Props = {
  event: DemoConference;
  phoneSearch: boolean;
  people: Profile[];
  me: DemoPerson;
  tab: string;
  setTab: (s: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  open: (s: string) => void;
  manage: () => void;
  query: string;
  setQuery: (s: string) => void;
};
export default function PeopleBrowser({
  event,
  phoneSearch,
  people,
  me,
  tab,
  setTab,
  filter,
  setFilter,
  open,
  manage,
  query,
  setQuery,
}: Props) {
  const { papers, sessions, rooms } = event;
  const [filterOpen, setFilterOpen] = useState(false),
    [authorOnly, setAuthorOnly] = useState(false),
    [letter, setLetter] = useState("");
  const nameFor = (p: Profile) =>
    tab === "affiliations"
      ? p.affiliation || "No affiliation"
      : tab === "now"
        ? p.checkIn?.room || ""
        : surname(p)[0]?.toLocaleUpperCase() || "#";
  const list = people
    .filter((p) => {
      if (
        (tab === "now" && !p.checkIn) ||
        (tab === "matches" && !overlap(me, p).score) ||
        (authorOnly && !p.authored.length)
      )
        return false;
      if (
        filter.startsWith("paper:") &&
        !p.lists.some((l) => l.paperIds.includes(filter.slice(6)))
      )
        return false;
      if (filter.startsWith("session:") && !p.shared.includes(filter.slice(8)))
        return false;
      if (filter.startsWith("room:") && p.checkIn?.room !== filter.slice(5))
        return false;
      const sharedPapers = new Set([
        ...p.authored,
        ...p.lists.flatMap((l) => l.paperIds),
      ]);
      return [
        p.name,
        profileAffiliation(p),
        ...p.topics,
        p.checkIn?.room || "",
        ...papers.filter((a) => sharedPapers.has(a.id)).map((a) => a.title),
        ...sessions.filter((s) => p.shared.includes(s.id)).map((s) => s.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase());
    })
    .sort((a, b) =>
      tab === "matches"
        ? overlap(me, b).score - overlap(me, a).score
        : surname(a).localeCompare(surname(b)),
    );
  const groups =
    tab === "matches"
      ? [["Suggested matches", list] as const]
      : Array.from(new Set(list.map(nameFor)))
          .sort()
          .map((k) => [k, list.filter((p) => nameFor(p) === k)] as const);
  const selectedLetter =
    tab === "all"
      ? list.some((p) => nameFor(p) === letter)
        ? letter
        : list[0]
          ? nameFor(list[0])
          : ""
      : "";
  const activeFilter = filter.startsWith("paper:")
    ? papers.find((p) => "paper:" + p.id === filter)?.title
    : filter.startsWith("session:")
      ? sessions.find((s) => "session:" + s.id === filter)?.name
      : filter.slice(5);
  return (
    <section className="peoplePwa">
      <div className={"peopleTools " + (phoneSearch ? "phoneVisible" : "")}>
        <label className="search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search attendees"
            placeholder="Search sessions, contents, people, notes"
          />
        </label>
        <button
          className="outlined"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>
      {filterOpen && (
        <div className="filterPanel">
          <label>
            Show people by paper, session, or room
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All people</option>
              <optgroup label="Shared reading lists">
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
              <optgroup label="Current check-ins">
                {rooms.map((r) => (
                  <option key={r} value={"room:" + r}>
                    {r}
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
      <div className="pwaTabs">
        {tabs.map(([id, title]) => (
          <button
            key={id}
            aria-pressed={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => {
              setTab(id);
              setLetter("");
            }}
          >
            {title}
          </button>
        ))}
      </div>
      {tab === "all" && (
        <div className="azBar" aria-label="Surname initials">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map((k) => (
            <button
              key={k}
              aria-pressed={selectedLetter === k}
              disabled={!list.some((p) => nameFor(p) === k)}
              onClick={() => {
                setLetter(k);
                document
                  .getElementById("people-letter-" + k)
                  ?.scrollIntoView({ block: "nearest" });
              }}
            >
              {k}
            </button>
          ))}
        </div>
      )}
      <div className="peopleBody">
        {(filter || authorOnly) && (
          <button
            className="clearFilter"
            onClick={() => {
              setFilter("");
              setAuthorOnly(false);
              setLetter("");
            }}
          >
            Clear filter ·{" "}
            {[activeFilter, authorOnly ? "Linked authors" : ""]
              .filter(Boolean)
              .join(" · ")}
          </button>
        )}
        {tab === "now" && (
          <div className="sectionIntro">
            <p>
              Manual room check-ins shared with you. Each expires after one
              hour.
            </p>
            <button className="textBtn" onClick={manage}>
              <MapPin size={15} />
              My current room
            </button>
          </div>
        )}
        {tab === "matches" && (
          <p className="matchExplain">
            Based on common research topics, papers and session plans shared
            with you.
          </p>
        )}
        {groups.map(([k, attendees]) => (
          <div
            id={"people-letter-" + k}
            className={"alphaGroup " + (tab === "all" ? "initialGroup" : "")}
            key={k}
          >
            <h3>{k}</h3>
            <div className="alphaPeople">
              {attendees.map((p) => (
                <button key={p.id} onClick={() => open(p.id)}>
                  <span>{p.name}</span>
                  {tab === "now" ? (
                    <small>Checked in</small>
                  ) : tab === "matches" ? (
                    <small>
                      {overlap(me, p).score} shared interests or plans
                    </small>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!list.length && (
          <div className="panel empty">
            <h3>
              {tab === "now"
                ? "No room check-ins visible to you"
                : "No matching people"}
            </h3>
            <p>
              {tab === "now"
                ? "People appear here after checking in and sharing their current room with you."
                : "Try another search or explore the demo program."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
