async function redisCommand(env, cmd, ...args) {
  const REST_URL = env.UPSTASH_REDIS_REST_URL;
  const REST_TOKEN = env.UPSTASH_REDIS_REST_TOKEN;
  if (!REST_URL || !REST_TOKEN) {
    throw new Error("Missing UPSTASH env");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(REST_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([cmd, ...args])
    });
    clearTimeout(timeout);
    const data = await resp.json();
    if (data.error) {
      throw new Error(`Upstash api error: ${data.error}`);
    }
    return data.result;
  } catch (e) {
    clearTimeout(timeout);
    throw new Error(`Fetch failed: ${e.message}`);
  }
}

function makeKV(env) {
  return {
    async get(key) {
      const raw = await redisCommand(env, "GET", key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    },
    async set(key, value) {
      const str = typeof value === "string" ? value : JSON.stringify(value);
      await redisCommand(env, "SET", key, str);
      return true;
    },
    async del(key) {
      await redisCommand(env, "DEL", key);
      return true;
    },
    async keys(pattern) {
      return await redisCommand(env, "KEYS", pattern);
    }
  };
}

export function getKV(env) {
  return makeKV(env);
}

export async function verifyAuth({ providedPassword, serverPassword, kv }) {
  if (!serverPassword || !providedPassword) return false;
  return providedPassword === serverPassword;
}

export function getCorsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-auth-password"
  };
}

export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      ...headers
    }
  });
}
