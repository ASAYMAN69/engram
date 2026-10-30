// storage.js: Forge KVS adapter with in-memory fallback for tests/local dev.
let backendPromise = null;

function memoryStorage() {
  const mem = new Map();
  return {
    async get(key) { return mem.has(key) ? mem.get(key) : null; },
    async set(key, value) { mem.set(key, value); },
    async delete(key) { mem.delete(key); },
    query() {
      return {
        async getMany() {
          const results = [...mem.entries()].map(([key, value]) => ({ key, value }));
          return { results, nextCursor: undefined };
        },
      };
    },
  };
}

async function resolveBackend() {
  if (backendPromise) return backendPromise;
  backendPromise = (async () => {
    try {
      const mod = await import("@forge/storage");
      if (mod && mod.storage) return mod.storage;
    } catch (e) { /* fall through */ }
    try {
      const mod = await import("@forge/api");
      if (mod && mod.storage) return mod.storage;
    } catch (e) { /* fall through */ }
    return memoryStorage();
  })();
  return backendPromise;
}

export async function getKvs() { return resolveBackend(); }

export function resetBackend() { backendPromise = null; }