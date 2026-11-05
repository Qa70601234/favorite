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

// KV 实例
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

// 对外 getKV，debug.js / auth.js 要调用这个
export function getKV(env) {
  return kvInstance;
}

// 鉴权函数，auth.js / debug.js 依赖
export async function verifyAuth({ providedPassword, serverPassword, kv }) {
  if (!serverPassword) return false;
  if (!providedPassword) return false;
  return providedPassword === serverPassword;
}

// CORS 头
export function getCorsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-auth-password"
  };
}

// json 返回包装
export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      ...headers
    }
  });
}

// 默认导出（兼容其他旧写法）
export default kvInstance;
