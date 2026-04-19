const store: Record<string, string> = {};

export const kv = {
  async set(key: string, value: unknown): Promise<void> {
    store[key] = JSON.stringify(value);
  },

  async get<T>(key: string): Promise<T | null> {
    const val = store[key];
    if (!val) return null;
    return JSON.parse(val) as T;
  },

  async delete(key: string): Promise<void> {
    delete store[key];
  },

  async keys(pattern: string): Promise<string[]> {
    const prefix = pattern.replace("*", "");
    return Object.keys(store).filter((k) => k.startsWith(prefix));
  },
};