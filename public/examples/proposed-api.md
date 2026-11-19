# CHI conference networking API proposal

The [SIGCHI Cloud API](https://services.sigchi.org/assets/pdf/cloud-api.pdf?version=4.9.24) documents conference discovery, conference programs and an authorized personal agenda. The networking resources below are proposed extensions. The demo uses a curated public [CHI 2026 program](https://programs.sigchi.org/chi/2026/program). Session times are in Barcelona local time.

## Resources

Paths below follow `/api/demo/conferences/{conferenceId}/`. Use `chi26-demo` for Barcelona or `chi25-demo` for Yokohama. Profile audiences, research-link visibility, reading lists, session plans, check-ins, and conversations are scoped to that conference. A name-only account can set a different audience at each event. A new event starts private. The existing CHI ’26 settings remain attached to Barcelona.

| Method | Resource | Result |
| --- | --- | --- |
| POST | `profiles` | Create a demo profile with a name. Defaults to private. An optional `audience` accepts the same mode and people as a sharing preference. |
| GET | `attendees` | Return profiles visible to the viewer. |
| GET | `attendees/{id}` | Download the viewer-specific profile, or 404 when the profile is private to them. Guests receive 403. |
| GET | `attendees?paper={id}` | People who shared a reading list containing this paper with the viewer. |
| GET | `attendees?session={id}` | People who shared a plan for this session with the viewer. |
| GET | `attendees?room={room}` | People who explicitly checked into the room and shared it with the viewer. |
| PATCH | `me/sharing` | Change profile, research link, list, session, or current-room sharing. Also used for manual check-in and check-out. |
| PATCH | `me/reminders` | Save a personal reminder time for this conference with `minutesBefore` set to 5, 10, 15, or 30. Set it to 0 to turn reminders off. |
| POST | `messages` | Send a demo message when sender and recipient can see each other’s profile. |

## Who can see what

Every item has its own audience: only me, selected people or all registered conference attendees. The profile audience also applies to each item. Selecting someone for a check-in cannot give them access to a hidden profile. Reading-list downloads, session filters and room lookups use the same viewer-specific projection. A manual check-in expires in one hour and can be cleared early. Adding a session to a plan does not check someone into its room. The camera and photo readers resolve a CHI room locally from its sign or a demo QR. Only the confirmed room name goes into the existing check-in request. Simulated check-ins run on the visitor’s clock. Session times follow the selected conference’s local time.

For example, with the profile visible to attendees, the following audience limits room check-ins to Carla:
```json
{"field":"audience.currentRoom","value":{"mode":"selected","people":["carla"]}}
```

GitHub Pages simulates all requests in the current browser. Name-only sign-up and the viewer switch are demo controls. A production service would authenticate users and enforce conference membership and permissions on the server. The demo does not verify that a typed name belongs to the visitor.

[Example data](./synthetic-data.json) · [Worked requests and responses](./requests-and-responses.json)
