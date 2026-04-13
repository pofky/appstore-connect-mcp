/**
 * License validation CF Worker for appstore-connect-mcp.
 *
 * Endpoints:
 *   POST /validate       — check a license key, return tier
 *   POST /webhook/polar  — Polar subscription webhook (create/cancel keys)
 *   GET  /health         — liveness check
 */

interface Env {
  DB: D1Database;
  POLAR_WEBHOOK_SECRET: string;
}

interface ValidateRequest {
  key: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for browser-based dashboard
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === "/health") {
        return json({ ok: true, ts: new Date().toISOString() }, corsHeaders);
      }

      if (url.pathname === "/validate" && request.method === "POST") {
        return handleValidate(request, env, corsHeaders);
      }

      if (url.pathname === "/webhook/polar" && request.method === "POST") {
        return handlePolarWebhook(request, env, corsHeaders);
      }

      if (url.pathname === "/success") {
        return handleSuccess(url, corsHeaders);
      }

      if (url.pathname === "/key" && request.method === "GET") {
        return handleKeyPage(corsHeaders);
      }

      if (url.pathname === "/key" && request.method === "POST") {
        return handleKeyLookup(request, env, corsHeaders);
      }

      return json({ error: "Not found" }, corsHeaders, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Internal error" }, corsHeaders, 500);
    }
  },
};

async function handleValidate(
  request: Request,
  env: Env,
  headers: Record<string, string>,
): Promise<Response> {
  const body = (await request.json()) as ValidateRequest;

  if (!body.key || typeof body.key !== "string") {
    return json({ valid: false, tier: "free" }, headers, 400);
  }

  const row = await env.DB.prepare(
    "SELECT tier, expires_at, active FROM licenses WHERE key = ?",
  )
    .bind(body.key)
    .first<{ tier: string; expires_at: string | null; active: number }>();

  if (!row || !row.active) {
    return json({ valid: false, tier: "free" }, headers);
  }

  // Check expiry
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return json({ valid: false, tier: "free", reason: "expired" }, headers);
  }

  return json(
    { valid: true, tier: row.tier, expires: row.expires_at },
    headers,
  );
}

async function handlePolarWebhook(
  request: Request,
  env: Env,
  headers: Record<string, string>,
): Promise<Response> {
  // Verify webhook signature
  const signature = request.headers.get("x-polar-signature");
  if (!signature) {
    return json({ error: "Missing signature" }, headers, 401);
  }

  const rawBody = await request.text();

  // Simple HMAC verification
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.POLAR_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (signature !== expectedSig) {
    return json({ error: "Invalid signature" }, headers, 401);
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: {
      id: string;
      customer_email?: string;
      status?: string;
      current_period_end?: string;
    };
  };

  if (event.type === "subscription.created" || event.type === "subscription.updated") {
    const sub = event.data;
    const licenseKey = generateLicenseKey();
    const expiresAt = sub.current_period_end || null;

    await env.DB.prepare(
      `INSERT INTO licenses (key, tier, email, polar_subscription_id, expires_at, active, created_at)
       VALUES (?, 'pro', ?, ?, ?, 1, datetime('now'))
       ON CONFLICT(polar_subscription_id) DO UPDATE SET
         expires_at = excluded.expires_at,
         active = 1`,
    )
      .bind(licenseKey, sub.customer_email || "", sub.id, expiresAt)
      .run();

    return json({ ok: true, license_key: licenseKey }, headers);
  }

  if (event.type === "subscription.canceled" || event.type === "subscription.revoked") {
    await env.DB.prepare(
      "UPDATE licenses SET active = 0 WHERE polar_subscription_id = ?",
    )
      .bind(event.data.id)
      .run();

    return json({ ok: true, deactivated: true }, headers);
  }

  return json({ ok: true, ignored: true }, headers);
}

function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = 4;
  const segLen = 5;
  const parts: string[] = [];
  const bytes = new Uint8Array(segments * segLen);
  crypto.getRandomValues(bytes);

  for (let s = 0; s < segments; s++) {
    let part = "";
    for (let i = 0; i < segLen; i++) {
      part += chars[bytes[s * segLen + i] % chars.length];
    }
    parts.push(part);
  }
  return `ASC-${parts.join("-")}`;
}

function handleSuccess(
  url: URL,
  headers: Record<string, string>,
): Response {
  return html(`
    <h1>Thanks for subscribing!</h1>
    <p>Your Pro license is ready. Enter the email you used at checkout to retrieve your license key:</p>
    <form method="POST" action="/key">
      <input type="email" name="email" placeholder="you@example.com" required
        style="padding:10px;font-size:16px;width:300px;border:1px solid #555;border-radius:6px;background:#1a1a2e;color:#fff">
      <button type="submit"
        style="padding:10px 20px;font-size:16px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-left:8px">
        Get License Key
      </button>
    </form>
  `, headers);
}

function handleKeyPage(headers: Record<string, string>): Response {
  return html(`
    <h1>Retrieve Your License Key</h1>
    <p>Enter the email you used when purchasing App Store Connect MCP Pro:</p>
    <form method="POST" action="/key">
      <input type="email" name="email" placeholder="you@example.com" required
        style="padding:10px;font-size:16px;width:300px;border:1px solid #555;border-radius:6px;background:#1a1a2e;color:#fff">
      <button type="submit"
        style="padding:10px 20px;font-size:16px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-left:8px">
        Look Up Key
      </button>
    </form>
  `, headers);
}

async function handleKeyLookup(
  request: Request,
  env: Env,
  headers: Record<string, string>,
): Promise<Response> {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return html("<h1>Email required</h1><p><a href='/key'>Try again</a></p>", headers, 400);
  }

  const row = await env.DB.prepare(
    "SELECT key, tier, active FROM licenses WHERE email = ? AND active = 1 ORDER BY created_at DESC LIMIT 1",
  )
    .bind(email)
    .first<{ key: string; tier: string; active: number }>();

  if (!row) {
    return html(`
      <h1>No active license found</h1>
      <p>No active Pro license found for <strong>${escapeHtml(email)}</strong>.</p>
      <p>If you just purchased, it may take a minute for the webhook to process. <a href="/key">Try again</a>.</p>
      <p>Need to subscribe? <a href="https://buy.polar.sh/polar_cl_Ta3OxEA1EbRyYNPFtSsRXgYWBCCtjwMxlbAeW35RLuu">Get Pro</a></p>
    `, headers);
  }

  return html(`
    <h1>Your License Key</h1>
    <div style="background:#1a1a2e;padding:20px;border-radius:8px;border:1px solid #333;margin:20px 0;font-family:monospace;font-size:20px;letter-spacing:2px;text-align:center">
      ${escapeHtml(row.key)}
    </div>
    <p>Add this to your MCP server configuration:</p>
    <pre style="background:#1a1a2e;padding:15px;border-radius:8px;overflow-x:auto">"ASC_LICENSE_KEY": "${escapeHtml(row.key)}"</pre>
    <p style="color:#888;font-size:14px">Keep this key private. It unlocks Pro tools on your machine.</p>
  `, headers);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function html(body: string, extraHeaders: Record<string, string>, status = 200): Response {
  const page = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>App Store Connect MCP</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;max-width:600px;margin:40px auto;padding:0 20px;background:#0d0d1a;color:#e0e0e0}
a{color:#818cf8}h1{color:#fff}pre{color:#a5b4fc}</style></head><body>${body}</body></html>`;
  return new Response(page, {
    status,
    headers: { "Content-Type": "text/html;charset=utf-8", ...extraHeaders },
  });
}

function json(
  data: unknown,
  extraHeaders: Record<string, string>,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
