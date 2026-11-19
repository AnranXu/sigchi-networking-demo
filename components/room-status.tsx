"use client";
import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleHelp,
  DoorOpen,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react";
import {
  roomStatuses,
  type RoomBoard,
  type RoomSummary,
  type SeatReport,
} from "../lib/room-status";

export function RoomBadge({ status }: { status: RoomSummary["status"] }) {
  return (
    <span className={"occupancyBadge occupancy-" + status}>
      <i aria-hidden="true" />
      {roomStatuses[status]}
    </span>
  );
}
type Props = {
  board: RoomBoard;
  selected: string;
  select: (room: string) => void;
  signedIn: boolean;
  busy: boolean;
  tryAttendee: () => void;
  checkIn: (room: string) => void;
  report: (room: string, status: SeatReport | null) => void;
  move: (room: string | null) => void;
};
function reportAge(time: number, now: number) {
  const age = Math.max(0, Math.floor((now - time) / 60_000));
  return age ? age + (age === 1 ? " minute ago" : " minutes ago") : "just now";
}
export function RoomStatusPage({
  board,
  selected,
  select,
  signedIn,
  busy,
  tryAttendee,
  checkIn,
  report,
  move,
}: Props) {
  const [now, setNow] = useState(Date.now);
  const [initialRoom] = useState(
    () =>
      board.rooms.find((r) => r.status === "full")?.room ||
      board.rooms[0]?.room,
  );
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const room =
    board.rooms.find((r) => r.room === selected) ||
    board.rooms.find((r) => r.room === initialRoom) ||
    board.rooms[0];
  if (!room) return <p>No rooms are listed for this conference.</p>;
  const counters = board.rooms.filter((r) => r.capacity !== null);
  const ordered = [...board.rooms].sort(
    (a, b) =>
      Number(b.capacity !== null) - Number(a.capacity !== null) ||
      a.room.localeCompare(b.room, undefined, { numeric: true }),
  );
  const notice =
    room.source === "report"
      ? "Latest attendee report · " + reportAge(room.reportedAt!, now)
      : room.source === "counter"
        ? "Based on the demo badge count."
        : room.source === "checkIns"
          ? "Voluntary check-ins have reached the example capacity."
          : "No recent report for this room.";
  return (
    <div className="roomBoard">
      <p className="roomIntro">
        See how full each room is. Room names come from the program. Seat limits
        and indoor badge counts are examples.
      </p>
      <div className="roomColumns">
        <section className="roomDirectory panel" aria-label="Choose a room">
          <h2>Conference rooms</h2>
          <div className="roomIndex">
            {ordered.map((r) => (
              <button
                key={r.room}
                type="button"
                aria-pressed={r.room === room.room}
                onClick={() => select(r.room)}
              >
                <span>{r.room}</span>
                <RoomBadge status={r.status} />
              </button>
            ))}
          </div>
          <label className="roomMobilePicker">
            Choose a room
            <select
              aria-label="Choose a room"
              value={room.room}
              onChange={(e) => select(e.target.value)}
            >
              {ordered.map((r) => (
                <option key={r.room} value={r.room}>
                  {r.room} · {roomStatuses[r.status]}
                </option>
              ))}
            </select>
          </label>
        </section>
        <div className="roomDetails">
          <section className="panel roomCard" aria-label="Selected room">
            <header>
              <span className="roomGlyph">
                <DoorOpen size={21} aria-hidden="true" />
              </span>
              <h2>{room.room}</h2>
            </header>
            <div className="roomCondition">
              <RoomBadge status={room.status} />
              <span>{notice}</span>
            </div>
            {room.capacity !== null && room.counted !== null && (
              <div className="roomMeter">
                <div>
                  <span>Demo badge count</span>
                  <strong>
                    {room.counted} / {room.capacity}
                  </strong>
                </div>
                <meter
                  min={0}
                  max={room.capacity}
                  value={Math.min(room.counted, room.capacity)}
                  aria-label="Demo badge count"
                  aria-valuetext={
                    room.counted +
                    " badges for " +
                    room.capacity +
                    " example places"
                  }
                />
              </div>
            )}
            <div className="roomVolunteers">
              <Users size={17} aria-hidden="true" />
              <span>
                {room.checkIns} voluntary{" "}
                {room.checkIns === 1 ? "check-in" : "check-ins"}
              </span>
              {signedIn && (
                <button
                  className="textBtn"
                  type="button"
                  onClick={() => checkIn(room.room)}
                >
                  Check in here
                </button>
              )}
            </div>
            <p className="roomFine">
              Only people who choose to be counted appear in this total. Their
              names stay hidden here.
            </p>
          </section>
          <section className="panel roomCard" aria-label="Attendee reports">
            <header>
              <MessageSquare size={19} aria-hidden="true" />
              <h3>How full is the room?</h3>
            </header>
            <p>
              Tell other attendees what you see. Each report lasts 15 minutes.
            </p>
            {signedIn ? (
              <>
                <div
                  className="roomReportChoices"
                  role="group"
                  aria-label="Report room status"
                >
                  {(["open", "limited", "full"] as const).map((status) => (
                    <button
                      type="button"
                      className="outlined"
                      key={status}
                      disabled={busy}
                      aria-pressed={room.myReport === status}
                      onClick={() => report(room.room, status)}
                    >
                      {room.myReport === status && (
                        <CheckCircle2 size={15} aria-hidden="true" />
                      )}
                      {roomStatuses[status]}
                    </button>
                  ))}
                </div>
                <div className="roomReportFoot">
                  <small>
                    {room.reports} recent{" "}
                    {room.reports === 1 ? "report" : "reports"}
                  </small>
                  {room.myReport && (
                    <button
                      type="button"
                      className="textBtn"
                      disabled={busy}
                      onClick={() => report(room.room, null)}
                    >
                      Remove my report
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button type="button" className="outlined" onClick={tryAttendee}>
                Try as Carla
              </button>
            )}
          </section>
          <details className="panel roomCard roomSimulation">
            <summary>
              <MapPin size={18} aria-hidden="true" />
              Try indoor counting
            </summary>
            <p>
              Move one simulated badge between rooms. The room it leaves loses
              one person and the room it enters gains one.
            </p>
            {signedIn ? (
              <label>
                Demo badge location
                <select
                  aria-label="Demo badge location"
                  disabled={busy}
                  value={board.badgeRoom || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    if (name) select(name);
                    move(name || null);
                  }}
                >
                  <option value="">Outside the rooms</option>
                  {counters.map((r) => (
                    <option key={r.room} value={r.room}>
                      {r.room}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <button type="button" className="textBtn" onClick={tryAttendee}>
                Try with a demo attendee
              </button>
            )}
          </details>
        </div>
      </div>
      <p className="roomFine roomScope">
        <CircleHelp size={15} aria-hidden="true" />
        Try another attendee under “View as” to see their updates in this demo.
      </p>
    </div>
  );
}
