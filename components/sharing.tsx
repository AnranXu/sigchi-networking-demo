"use client";
import React, { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { rooms } from "../lib/demo-fixtures";
import {
  audience,
  type Audience,
  type DemoPerson,
  type Identity,
} from "../lib/network-model";

const choices = [
  { mode: "private", label: "Only me" },
  { mode: "selected", label: "Selected people" },
  { mode: "attendees", label: "All attendees" },
] as const;
type Save = (field: string, value: unknown) => Promise<void>;

export function AudienceControl({
  label,
  rule,
  people,
  save,
  busy,
  primary = false,
}: {
  label: string;
  rule: Audience;
  people: Identity[];
  save: (rule: Audience) => void;
  busy: boolean;
  primary?: boolean;
}) {
  const name = useId();
  function choose(mode: Audience["mode"]) {
    if (mode !== rule.mode) save({ mode, people: [] });
  }
  return (
    <div className={primary ? "audiencePrimary" : "audienceInline"}>
      {primary ? (
        <fieldset className="audienceChoice" disabled={busy}>
          <legend>{label}</legend>
          <div className="audienceOptions">
            {choices.map(({ mode, label: option }) => (
              <label key={mode} className={rule.mode === mode ? "chosen" : ""}>
                <input
                  type="radio"
                  name={name}
                  checked={rule.mode === mode}
                  onChange={() => choose(mode)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <label className="audienceSelect">
          <span id={name}>{label}</span>
          <select aria-labelledby={name}
            disabled={busy}
            value={rule.mode}
            onChange={(e) => choose(e.target.value as Audience["mode"])}
          >
            {choices.map((c) => (
              <option key={c.mode} value={c.mode}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {rule.mode === "selected" && (
        <fieldset className="audienceMembers" disabled={busy}>
          <legend>Choose people</legend>
          <div className="personChoices">
            {people.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={rule.people.includes(p.id)}
                  onChange={(e) =>
                    save({
                      mode: "selected",
                      people: e.target.checked
                        ? [...rule.people, p.id]
                        : rule.people.filter((id) => id !== p.id),
                    })
                  }
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}

export function ProfileDisclosure({
  title,
  status,
  icon,
  children,
  open,
  onToggle,
}: {
  title: string;
  status?: string;
  icon: ReactNode;
  children: ReactNode;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}) {
  return (
    <details
      className="profileDisclosure"
      open={open}
      onToggle={onToggle ? (e) => onToggle(e.currentTarget.open) : undefined}
    >
      <summary>
        <span className="disclosureIcon">{icon}</span>
        <span className="disclosureLabel">
          {title}
          {status && <small>{status}</small>}
        </span>
        <ChevronDown aria-hidden="true" size={17} />
      </summary>
      <div className="disclosureBody">{children}</div>
    </details>
  );
}

export function CheckInPanel({
  me,
  people,
  change,
  busy,
}: {
  me: DemoPerson;
  people: Identity[];
  change: Save;
  busy: boolean;
}) {
  const [room, setRoom] = useState(me.checkIn?.room || rooms[0]);
  return (
    <div className="roomEditor">
      {me.checkIn && (
        <p>
          Checked into <strong>{me.checkIn.room}</strong> until{" "}
          {new Date(me.checkIn.expiresAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </p>
      )}
      <label className="audienceSelect">
        <span>Room</span>
        <select
          value={room}
          disabled={busy}
          onChange={(e) => setRoom(e.target.value)}
        >
          {rooms.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <AudienceControl
        label="Who can see this check-in?"
        rule={me.rules.currentRoom}
        people={people}
        save={(a) => change("audience.currentRoom", a)}
        busy={busy}
      />
      {me.rules.profile.mode !== "attendees" && (
        <p className="hint">
          {me.rules.profile.mode === "private"
            ? "Only you can see this check-in while your profile is private."
            : "Only people in your profile audience can see shared check-ins."}
        </p>
      )}
      <div className="formRow">
        <button
          className="primary"
          disabled={busy}
          onClick={() => change("checkIn", { room })}
        >
          {me.checkIn ? "Update check-in" : "Check in for 1 hour"}
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
    </div>
  );
}

export function CreateProfile({
  onCreate,
  people,
  busy,
}: {
  onCreate: (name: string, rule: Audience) => void;
  people: Identity[];
  busy: boolean;
}) {
  const [name, setName] = useState(""),
    [rule, setRule] = useState<Audience>(audience(false));
  return (
    <form
      className="joinCard panel simpleSignup"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onCreate(name.trim(), rule);
      }}
    >
      <h2>Create your conference profile</h2>
      <label className="nameField" htmlFor="display-name">
        Your name
        <input
          id="display-name"
          autoComplete="name"
          maxLength={80}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name to display"
        />
      </label>
      <AudienceControl
        primary
        label="Who can see my profile?"
        rule={rule}
        people={people}
        save={setRule}
        busy={busy}
      />
      <button
        className="primary"
        disabled={
          busy ||
          !name.trim() ||
          (rule.mode === "selected" && !rule.people.length)
        }
      >
        Create profile
      </button>
    </form>
  );
}
