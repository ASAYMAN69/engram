# Engram

Decision memory for software teams — an Atlassian Forge app (Codegeist hackathon entry).

## Stack
- Backend: Node.js 24.x (Forge runtime `nodejs24.x`), `@forge/*`
- Frontend: React 18 + Vite (Custom UI)
- Storage: Forge KVS
- AI: Rovo agent + Forge LLM (optional)

## Monorepo layout
- `./` — Forge app (manifest, resolvers, storage)
- `frontend/` — React Custom UI
- `shared/` — shared types

## Local dev (nvm)
```bash
nvm use
npm install
npm run dev          # frontend HMR (vite)
forge tunnel          # backend tunnel
```

## Build / typecheck / test
```bash
npm run build
npm run typecheck
npm run test
npm run lint         # forge lint
```

## Docker (reproducible build)
```bash
docker compose up --build
```

## Deploy
```bash
forge register   # first time
forge deploy
forge install
```
