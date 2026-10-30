# Build stage
FROM node:24.22.2-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared ./shared
COPY frontend ./frontend
RUN npm install --workspaces
RUN npm run build

# Runtime (Forge tooling) stage
FROM node:24.22.2-alpine AS runtime
RUN npm i -g @forge/cli@latest
WORKDIR /app
COPY . .
COPY --from=build /app/frontend/dist ./frontend/dist
CMD ["forge", "--version"]
