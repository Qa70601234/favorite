// functions/api/_kvAdapter.js
const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REST_URL || !REST_TOKEN) {
  throw new Error("缺少 Upstash 环境变量：UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
}

async function redisCommand(cmd, ...args) {
  const resp = await fetch(REST_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([cmd, ...args])
  });
  const data = await resp.json();
  if (data.error) {
    throw new Error(`Upstash Error: ${data.error}`);
  }
  return data.result;
}

export default {
  async get(key) {
    const raw = await redisCommand("GET", key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  },

  async set(key, value) {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    await redisCommand("SET", key, str);
    return true;
  },

  async del(key) {
    await redisCommand("DEL", key);
    return true;
  },

  async keys(pattern) {
    return await redisCommand("KEYS", pattern);
  }
};
