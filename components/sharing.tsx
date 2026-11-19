"use client";
import React, { useEffect, useState } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import { rooms, sessions } from "../lib/demo-fixtures";
import {
  audienceName,
  type Audience,
  type DemoPerson,
  type Identity,
} from "../lib/network-model";
type Save = (field: string, value: unknown) => Promise<void>;
export function AudienceControl({
  label,
  rule,
  people,
  save,
  busy,
}: {
  label: string;
  rule: Audience;
  people: Identity[];
  save: (rule: Audience) => void;
  busy: boolean;
}) {
  const [mode, setMode] = useState(rule.mode),
    [selected, setSelected] = useState(rule.people);
  const signature = JSON.stringify(rule);
  useEffect(() => {
    setMode(rule.mode);
    setSelected(rule.people);
  }, [signature]);
  const value = { mode, people: mode === "selected" ? selected : [] };
  const changed = JSON.stringify(value) !== signature;
  return (
    <div className="permissionRow">
      <div className="permissionHead">
        <b>{label}</b>
        <select
          aria-label={"Audience for " + label}
          value={mode}
          disabled={busy}
          onChange={(e) => {
            const m = e.target.value as Audience["mode"];
            setMode(m);
            if (m !== "selected") save({ mode: m, people: [] });
          }}
        >
          <option value="private">Only me</option>
          <option value="selected">Selected people</option>
          <option value="attendees">Conference attendees</option>
        </select>
      </div>
      {mode === "selected" && (
        <fieldset>
          <legend>People who can see {label.toLowerCase()}</legend>
          <div className="personChoices">
            {people.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, p.id]
                        : selected.filter((id) => id !== p.id),
                    )
                  }
                />
                {p.name}
              </label>
            ))}
          </div>
          <button
            className="outlined"
            disabled={busy || !changed}
            onClick={() => save(value)}
          >
            Save audience
          </button>
        </fieldset>
      )}
    </div>
  );
}
export function SharingPanel({
  me,
  identities,
  change,
  busy,
}: {
  me: DemoPerson;
  identities: Identity[];
  change: Save;
  busy: boolean;
}) {
  const fields = [
    ["profile", "Conference profile"],
    ["links", "Research links"],
    ["currentRoom", "Current room"],
    ...me.lists.map((l) => ["list." + l.id, l.name]),
    ...sessions.map((s) => ["session." + s.id, "Plan · " + s.name]),
  ];
  return (
    <section className="panel record permissionPanel">
      <h2>
        <ShieldCheck size={21} />
        Who can see my information?
      </h2>
      <p>
        Your profile audience sets the outer limit. Each item can have a smaller
        audience. Session plans appear only for sessions in your plan.
      </p>
      {fields.map(([key, label]) => (
        <AudienceControl
          key={me.id + key}
          label={label}
          rule={me.rules[key]}
          people={identities.filter((p) => p.id !== me.id && p.id !== "guest")}
          busy={busy}
          save={(rule) => change("audience." + key, rule)}
        />
      ))}
    </section>
  );
}
export function CheckInPanel({
  me,
  change,
  busy,
}: {
  me: DemoPerson;
  change: Save;
  busy: boolean;
}) {
  const [room, setRoom] = useState(me.checkIn?.room || rooms[0]);
  const until = me.checkIn
    ? new Date(me.checkIn.expiresAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return (
    <section className="panel record checkInPanel">
      <h2>
        <MapPin size={20} />
        My current room
      </h2>
      <p>
        Check in manually for one demo hour. You can leave at any time. Your
        session plan stays separate.
      </p>
      <div className="checkStatus">
        {me.checkIn ? (
          <>
            <strong>{me.checkIn.room}</strong> · until {until}
          </>
        ) : (
          "No active check-in"
        )}
      </div>
      <div className="formRow">
        <select
          aria-label="Choose my current room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        >
          {rooms.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <button
          className="primary"
          disabled={busy}
          onClick={() => change("checkIn", { room })}
        >
          {me.checkIn ? "Update check-in" : "Check in"}
        </button>
        {me.checkIn && (
          <button
            className="outlined"
            disabled={busy}
            onClick={() => change("checkIn", null)}
          >
            Leave room
          </button>
        )}
      </div>
      <p className="hint">
        Room audience · {audienceName(me.rules.currentRoom)}
        {!me.profileVisible ? " · Profile is private" : ""}
      </p>
    </section>
  );
}
export function CreateProfile({
  onCreate,
  busy,
}: {
  onCreate: (name: string) => void;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <form
      className="joinCard panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onCreate(name.trim());
      }}
    >
      <h2>Create your conference profile</h2>
      <p>
        Enter your name to start. Your profile is private until you choose who
        can see it.
      </p>
      <label htmlFor="display-name">Your name</label>
      <div className="formRow">
        <input
          id="display-name"
          autoComplete="off"
          maxLength={80}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name to display"
        />
        <button className="primary" disabled={busy || !name.trim()}>
          Create profile
        </button>
      </div>
    </form>
  );
}
