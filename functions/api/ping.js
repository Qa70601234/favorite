export async function onRequest(ctx) {
  return new Response(JSON.stringify({ok: true, env: Object.keys(ctx.env)}), {
    headers: {"Content-Type":"application/json"}
  })
}
