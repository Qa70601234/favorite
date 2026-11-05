// functions/api/_kvAdapter.js
let REST_URL = "";
let REST_TOKEN = "";

async function redisCommand(cmd, ...args) {
  if (!REST_URL || !REST_TOKEN) {
    throw new Error("缺少 Upstash 配置");
  }
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

const kvInstance = {
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

// getKV 接收 env，在这里赋值 upstash 地址和token
export function getKV(env) {
  REST_URL = env.UPSTASH_REDIS_REST_URL;
  REST_TOKEN = env.UPSTASH_REDIS_REST_TOKEN;
  return kvInstance;
}

export async function verifyAuth({ providedPassword, serverPassword, kv }) {
  if (!serverPassword) return false;
  if (!providedPassword) return false;
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

export default kvInstance;
