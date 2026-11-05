// functions/api/auth.js
import { crypto } from 'node:crypto';
import { getCorsHeaders, jsonResponse } from './_kvAdapter.js';

// HMAC 签名
function sign(secret, ts) {
  return crypto.createHmac('sha256', secret).update(String(ts)).digest('hex');
}

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const headers = getCorsHeaders(env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, msg: "method not allow" }, 405, headers);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, msg: "json error" }, 400, headers);
  }

  const inputPwd = body.password ?? '';
  const realPwd = env.PASSWORD ?? '';
  if (inputPwd !== realPwd) {
    return jsonResponse({ ok: false, msg: "password wrong" }, 401, headers);
  }

  // 生成时间戳 + 签名，有效期 1 小时
  const now = Math.floor(Date.now() / 1000);
  const expireTs = now + 3600;
  const token = sign(realPwd, expireTs);

  // 设置 Cookie
  headers.append('Set-Cookie', `eo_time=${expireTs}; Path=/; SameSite=Lax; HttpOnly;`);
  headers.append('Set-Cookie', `eo_token=${token}; Path=/; SameSite=Lax; HttpOnly;`);

  return jsonResponse({ ok: true, msg: "success" }, 200, headers);
}
