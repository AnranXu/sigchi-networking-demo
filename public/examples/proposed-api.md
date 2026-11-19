# Proposed SIGCHI conference networking API

This is a hackathon design for discussion. The [published SIGCHI Cloud API](https://services.sigchi.org/assets/pdf/cloud-api.pdf?version=4.9.24) describes access to the conference catalog, program and authorized personal agenda. The profiles, opt-in sharing, attendee lookup and messaging below are prototype extensions.

The GitHub Pages demo simulates requests inside your browser. The demo persona selector represents a registered attendee or a guest. Settings and messages persist in this browser. All fixtures are public and fictional. For a production API, the server would authenticate the viewer, verify registration for the specific conference and derive the owner from that verified identity, independent of any persona selector.

## Resource examples

All paths below follow `/api/demo/conferences/uist-demo/`.

| Method | Resource | Meaning |
| --- | --- | --- |
| GET | `attendees` | Registered viewers get only opted-in profiles. Each record includes explicitly shared lists, planned sessions and research links. |
| GET | `attendees/{id}` | Download the public projection of one visible attendee. Another viewer gets 404 for a private or unknown profile. An unregistered guest gets 403. |
| GET | `attendees?paper=p1` | Show people with the paper in a shared list. Private bookmarks cannot put someone in these results. |
| GET | `attendees?session=s1` | Show people who chose to share their plan for that session. A plan expresses intent and does not measure room occupancy. |
| PATCH | `me/sharing` | Change the viewer’s own profile, individual lists, individual session plans, or research links. |
| POST | `messages` | Send a fictional message between two visible demo profiles. In GitHub Pages it stays in the same browser. |

The `state` route and `POST /api/demo/start` support the demo UI. They are scaffolding for the prototype.

## Sharing rules

- A private conference profile hides all lists and session plans from other attendees. Turning a profile on restores its individual sharing choices. Lists and session plans start private for the Mira persona.
- Lists and plans are independent. Adding a session to a plan leaves its sharing switch off.
- Paper matches use membership in a shared reading list. Session matches use a shared plan. Suggested people are ranked by the number of common subjects, distinct papers and sessions. A viewer can use their own private interests to find a match. Other viewers only see signals the person shared.
- The author link requires an exact match on a fictional author identifier. Real ORCID integration would require verified linkage and handling authors without accounts. Personal website links use example.org, and Scholar links lead to topic searches.

## Example request bodies

```json
{"field":"profile","value":true}
```

```json
{"field":"list.reading","value":true}
```

```json
{"field":"session.s1","value":{"going":true,"shared":true}}
```

```json
{"recipient":"leo","body":"Which paper would you like to discuss?"}
```

See [worked request and response examples](./requests-and-responses.json) and [the full synthetic seed](./synthetic-data.json).
