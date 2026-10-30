# Engram — Decision Memory for Software Teams

Engram is an Atlassian Forge app that captures the *why* behind technical
decisions and surfaces them where work happens: inside Jira issues, via a Rovo
agent, and through contradiction warnings when new work conflicts with an
active decision.

## What it does

- **Capture** decisions from Jira comments and Confluence pages (title,
  summary, reasoning, rejected alternatives, decision maker, tags).
- **Surface** relevant past decisions on every Jira issue panel.
- **Warn** when a proposed change contradicts an active decision.
- **Answer** natural-language questions ("why did we choose X?") through a
  Rovo agent backed by Forge storage and the Teamwork Graph.

## How it uses the Atlassian platform

- **Forge** — app runtime (nodejs24.x), Custom UI (React + Vite), KVS
  storage for decision records, resolvers exposed to the frontend and Rovo.
- **Rovo** — conversational agent + action modules that search, extract, and
  check conflicts over stored decisions.
- **Teamwork Graph** — links decisions to Jira issues, Confluence pages, and
  the people who made them, enabling cross-product context.

## Install

### Prerequisites

- Node.js 24.x (`nvm use` reads `.nvmrc`)
- Atlassian Forge CLI (`npm i -g @forge/cli`)
- An Atlassian Cloud site with Jira (admin access)

### Steps

```bash
git clone <repo>
cd engram
npm install
npm run build        # builds shared types + frontend (frontend/dist)
forge login
forge register       # only first time; writes app.id into manifest.yml
forge deploy
forge install        # pick your site
```

For local development:

```bash
npm run dev          # frontend (Vite)
forge tunnel         # in another terminal
```

## 5-step judge test script

1. **Install** the app on a fresh site (`forge install`), open any Jira
   project.
2. **Load demo data** — open an issue, find the Engram panel, click
   "Load demo data". Expect `{ count: 6 }` and six decisions appear.
3. **Surface** — open an issue tagged `auth` / `database`; the panel lists
   the relevant past decision with reasoning and rejected alternatives.
4. **Conflict check** — type a proposed change that contradicts an active
   decision (e.g. "switch from Postgres to MySQL"); Engram returns
   `conflicts: true` with the decision id and reason.
5. **Ask Rovo** — in Rovo chat ask "Why did we choose Postgres over
   MySQL?"; the agent answers citing the stored decision.

## Creating the install link ("Start sharing your app")

1. `forge deploy` (production environment).
2. `forge install --site <site> --product jira` (or use the developer
   console).
3. In the Atlassian Developer Console, open the app -> Distribution ->
   Start sharing your app -> copy the install link.
4. Share the link with judges; they install into their own site.

## Marketplace submission

1. Complete the listing: name, description, icon, screenshots, privacy
   policy, support URL.
2. Ensure `forge lint` is clean and all CI checks pass.
3. Submit for review from the Developer Console -> Marketplace ->
   Submit app.
4. Address reviewer feedback; on approval the app is listed publicly.

## Development

```bash
npm run typecheck   # shared + frontend
npm run test        # shared + frontend + node tests
npm run build       # shared + frontend
npm run lint        # forge lint
```

## License

MIT (hackathon entry).
