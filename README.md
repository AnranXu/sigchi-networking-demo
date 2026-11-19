# CHI ’26 conference networking demo

[Open the demo](https://anranxu.github.io/sigchi-networking-demo/)

A SIGCHI hackathon prototype for sharing a profile, finding people through papers, and choosing who can see session plans or a temporary room check-in. The interface follows the [SIGCHI Programs People page](https://programs.sigchi.org/chi/2026/people/list) on desktop and mobile. The conference was held in Barcelona, April 13–17, 2026.

## Try the sharing controls

1. Enter a name, choose **Only me**, **Selected people**, or **All attendees**, and select **Create profile**. The default is **Only me**.
2. Open **My profile**. Under **Who can see my profile?**, choose **All attendees**. Expand **Current room**, choose **Selected people**, and select Carla Griggio. Use **Detect room** to read a room sign, use **Scan QR code** with a [printable room code](https://anranxu.github.io/sigchi-networking-demo/room-codes/), or choose a room manually. Confirm with **Check in for 1 hour**. Audience changes save immediately.
3. Under **View as**, select Carla. In **People → Here now**, your name appears in that room. Switch to Yun Huang and it disappears. Leaving the room or waiting an hour ends the check-in. A planned session never creates a room check-in.
4. Open a researcher’s profile to see public research, verified CHI contributions and suggested reading. In **Program**, save a real paper to your own reading list or add a session to your plan. Lists and plans have independent audiences.
5. Open **API examples** to inspect or download a viewer-specific response. The source fixture and worked examples are linked there.

## Conference data and people

The demo uses 14 real conference items and their 17 scheduled sessions from [the CHI 2026 program snapshot](https://files.sigchi.org/conference/cache/10142/86/program). Paper links open official program entries with publication DOIs. Author matches use the program’s person IDs and verified affiliations. Suggested reading is an editorial match to public research interests. It does not assert authorship or personal preference.

The six example profiles use public sources for [Anran Xu](https://anranxu.com/), [Carla Griggio](https://carlagriggio.com/), [Gonzalo Gabriel Méndez](https://hasp-lab.github.io/members/), [Nathalie Bressa](https://www.bressa.de/), [Vincent Cavez](https://www.vincentcavez.com/), and [Yun Huang](https://ischool.illinois.edu/people/yun-huang). Their reading lists, attendance plans, privacy choices and messages are illustrative. Sign and QR images are decoded on the device. The demo stores a confirmed room name and expiry. The public prototype stores changes in this browser. The viewer selector lets you compare perspectives within that copy.

[Data fixture](docs/examples/synthetic-data.json) · [Worked API requests and responses](docs/examples/requests-and-responses.json) · [API proposal](docs/examples/proposed-api.md)

## Build

With Node.js 22 or newer, run `npm ci`, `npm test`, and `npm run build`. Preview with `python -m http.server 8000 --directory docs`. GitHub Pages serves the committed `docs/` on `main`. Conference artwork and the SIGCHI mark come from the [official program](https://programs.sigchi.org/chi/2026). The included Montserrat font carries the SIL Open Font License.
