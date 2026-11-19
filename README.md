# SIGCHI conference networking demo

[Open the interactive demo](https://anranxu.github.io/sigchi-networking-demo/)

A hackathon prototype exploring how attendee-controlled sharing could fit into the SIGCHI Programs PWA. The interface uses UIST ’25 as a conference setting. All nine people, eight papers, four sessions, plans, and author identifiers in the fixtures are fictional. This is an independent prototype.

## A two-minute walkthrough

1. Start as **Mira Patel**. Open **Program** and choose **Who is interested?** under *Tactile Paths for Shared Diagrams*. Only attendees who shared a list containing the paper appear.
2. In **My profile**, make Mira visible. In **My lists**, share *Access & collaboration*. In **Program**, enable **Share my plan** for *Designing for access*.
3. Switch to **Leo Kim** in the header. Open Mira’s profile to see her selected list, session and research links. Download the profile as JSON. In **My matches**, open a profile to inspect the shared topics, papers and sessions.
4. Send Mira a demo message and switch back to read it. Switch to **Unregistered guest** to see what happens to directory access.
5. Open **API examples** and run a request. Turning Mira’s profile private removes her from the directory and makes a direct lookup by Leo return 404.

## Data and API proposal

- [Full synthetic dataset](docs/examples/synthetic-data.json)
- [Worked requests and responses](docs/examples/requests-and-responses.json)
- [Proposed endpoints and sharing rules](docs/examples/proposed-api.md)
- [Existing SIGCHI Cloud API reference](https://services.sigchi.org/assets/pdf/cloud-api.pdf?version=4.9.24)

GitHub Pages runs the proposed API in the browser. Demo changes persist in local storage and other visitors have independent copies. Anyone can inspect the fictional seed. The persona selector simulates conference registration. Chat, plan sharing and profile downloads use no SIGCHI account or credentials. A deployable service for real people would need server-enforced conference registration and authorization. Author matching uses illustrative identifiers and Google Scholar links lead to topic searches.

## Run and rebuild

Use Node.js 22 or newer. Run `npm ci`, `npm test`, and `npm run build`. To preview, run `python -m http.server 8000 --directory docs` and open the localhost URL. GitHub Pages publishes the committed `docs/` directory from `main`. Rebuild and commit this directory when changing the UI or fixture.

The conference thumbnail comes from the [SIGCHI conference asset service](https://files.sigchi.org/conference/logo/10138/c510d353-fe16-b4f5-9c3f-d7329bf0680c.png). The navigation and program context draw on [SIGCHI Programs](https://programs.sigchi.org/).
