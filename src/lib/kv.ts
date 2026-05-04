const restUrl = process.env.UPSTASH_REDIS_REST_URL;
const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisCommand(command: unknown[]): Promise<unknown> {
  if (!restUrl || !restToken) {
    throw new Error("Upstash Redis environment variables not set");
  }

  const url = `${restUrl}/${command.map((c) => encodeURIComponent(String(c))).join("/")}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${restToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Redis error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.result;
}

export const kv = {
  async set(key: string, value: unknown): Promise<void> {
    await redisCommand(["SET", key, JSON.stringify(value)]);
  },

  async get<T>(key: string): Promise<T | null> {
    const result = await redisCommand(["GET", key]);
    if (!result) return null;
    return JSON.parse(result as string) as T;
  },

  async delete(key: string): Promise<void> {
    await redisCommand(["DEL", key]);
  },

  async keys(pattern: string): Promise<string[]> {
    const result = await redisCommand(["KEYS", pattern]);
    return (result as string[]) || [];
  },
};