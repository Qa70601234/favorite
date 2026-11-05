// functions/api/auth.js
import { getKV, verifyAuth, jsonResponse, getCorsHeaders } from './_kvAdapter.js';

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const headers = getCorsHeaders(env);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, msg: "Method not allowed" }, 405, headers);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, msg: "JSON parse error" }, 400, headers);
  }

  const inputPwd = body.password || "";
  const realPwd = env.PASSWORD || "";

  // 打印对比（调试用，上线后删掉）
  console.log("input:", JSON.stringify(inputPwd));
  console.log("real:", JSON.stringify(realPwd));

  const ok = verifyAuth({
    providedPassword: inputPwd,
    serverPassword: realPwd,
    kv: getKV(env)
  });

  if (ok) {
    return jsonResponse({ ok: true, msg: "success" }, 200, headers);
  } else {
    return jsonResponse({ ok: false, msg: "密码错误" }, 401, headers);
  }
}
