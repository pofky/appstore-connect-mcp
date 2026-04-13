/**
 * License validation CF Worker for ASC MCP (@pofky/asc-mcp).
 *
 * Endpoints:
 *   POST /validate       - check a license key, return tier
 *   POST /webhook/polar  - Polar subscription webhook (create/cancel keys)
 *   GET  /health         - liveness check
 *   GET  /success        - post-checkout redirect
 *   GET  /key            - key retrieval form
 *   POST /key            - key lookup by email (rate-limited)
 */

interface Env {
  DB: D1Database;
  POLAR_WEBHOOK_SECRET: string;
}

interface ValidateRequest {
  key: string;
}

// Simple in-memory rate limiter for /key lookups (per worker instance)
const keyLookupAttempts = new Map<string, { count: number; resetAt: number }>();
const KEY_LOOKUP_MAX = 5;
const KEY_LOOKUP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS: only allow same-origin for HTML pages, open for /validate (MCP server calls it)
    const origin = request.headers.get("Origin") || "";
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Only /validate and /health need open CORS (called from local MCP server process)
    // HTML pages (/key, /success) are same-origin form submissions - no CORS needed
    if (url.pathname === "/validate" || url.pathname === "/health") {
      corsHeaders["Access-Control-Allow-Origin"] = "*";
    }

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
        return handleSuccess(corsHeaders);
      }

      if (url.pathname === "/key" && request.method === "GET") {
        return handleKeyPage(corsHeaders);
      }

      if (url.pathname === "/key" && request.method === "POST") {
        return handleKeyLookup(request, env, corsHeaders);
      }

      if (url.pathname === "/privacy") {
        return handlePrivacy(corsHeaders);
      }

      if (url.pathname === "/terms") {
        return handleTerms(corsHeaders);
      }

      if (url.pathname === "/delete" && request.method === "POST") {
        return handleDeleteRequest(request, env, corsHeaders);
      }

      if (url.pathname === "/delete" && request.method === "GET") {
        return handleDeletePage(corsHeaders);
      }

      return json({ error: "Not found" }, corsHeaders, 404);
    } catch (err) {
      console.error("Worker error");
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
  const signature = request.headers.get("x-polar-signature");
  if (!signature) {
    return json({ error: "Missing signature" }, headers, 401);
  }

  const rawBody = await request.text();

  // Timing-safe HMAC verification using crypto.subtle.verify
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.POLAR_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  // Convert the hex signature from Polar to an ArrayBuffer for comparison
  const sigBytes = new Uint8Array(
    (signature.match(/.{2}/g) || []).map((b) => parseInt(b, 16)),
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(rawBody),
  );

  if (!valid) {
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

    // Don't leak the license key in the response
    return json({ ok: true }, headers);
  }

  if (event.type === "subscription.canceled" || event.type === "subscription.revoked") {
    await env.DB.prepare(
      "UPDATE licenses SET active = 0 WHERE polar_subscription_id = ?",
    )
      .bind(event.data.id)
      .run();

    return json({ ok: true }, headers);
  }

  return json({ ok: true }, headers);
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

function handleSuccess(headers: Record<string, string>): Response {
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
  // Rate limit by IP
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const entry = keyLookupAttempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= KEY_LOOKUP_MAX) {
      return html(
        "<h1>Too many attempts</h1><p>Please wait 15 minutes before trying again.</p>",
        headers,
        429,
      );
    }
    entry.count++;
  } else {
    keyLookupAttempts.set(ip, { count: 1, resetAt: now + KEY_LOOKUP_WINDOW_MS });
  }

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

function handlePrivacy(headers: Record<string, string>): Response {
  return html(`
    <h1>Privacy Policy</h1>
    <p><em>Last updated: April 13, 2026</em></p>

    <h2>What we collect</h2>
    <p>When you purchase a Pro license, we store:</p>
    <ul>
      <li>Your email address (from the checkout provider)</li>
      <li>A generated license key</li>
      <li>Your subscription ID (for managing renewals and cancellations)</li>
    </ul>
    <p>When you use the free MCP server, we store nothing. The server runs locally on your machine.</p>

    <h2>What we don't collect</h2>
    <ul>
      <li>Your Apple API credentials (.p8 key, Key ID, Issuer ID) never leave your machine</li>
      <li>No App Store Connect data passes through our servers</li>
      <li>No analytics, telemetry, or tracking</li>
      <li>No cookies</li>
    </ul>

    <h2>How your data flows</h2>
    <p>The MCP server runs locally. It talks directly to Apple's API from your computer. The only network call to our infrastructure is a single license key validation check on startup, which sends only the license key string.</p>

    <h2>Data storage</h2>
    <p>License data is stored on Cloudflare D1 (EU region). Cloudflare acts as our infrastructure provider under their <a href="https://www.cloudflare.com/cloudflare-customer-dpa/">Data Processing Agreement</a>.</p>

    <h2>Payment processing</h2>
    <p>Payments are handled by <a href="https://polar.sh">Polar.sh</a>, who acts as Merchant of Record. We never see your credit card details. Polar's privacy policy applies to the checkout process.</p>

    <h2>Data retention</h2>
    <p>Active subscription data is kept while your subscription is active. After cancellation, your email and license data are deleted within 90 days.</p>

    <h2>Your rights (GDPR)</h2>
    <p>You can request access to, correction of, or deletion of your personal data at any time. To delete your data, visit <a href="/delete">/delete</a> or email us.</p>

    <h2>Contact</h2>
    <p>For privacy questions: povkonop@gmail.com</p>

    <p style="color:#888;font-size:13px;margin-top:40px">This project is not affiliated with, endorsed by, or sponsored by Apple Inc. Apple, App Store, App Store Connect, TestFlight, iOS, and macOS are trademarks of Apple Inc.</p>
  `, headers);
}

function handleTerms(headers: Record<string, string>): Response {
  return html(`
    <h1>Terms of Service</h1>
    <p><em>Last updated: April 13, 2026</em></p>

    <h2>What this is</h2>
    <p>App Store Connect MCP Server is a developer tool that connects AI coding agents to Apple's App Store Connect API. It runs locally on your machine.</p>

    <h2>Requirements</h2>
    <ul>
      <li>A valid Apple Developer Program membership</li>
      <li>An App Store Connect API key that you create and control</li>
      <li>Compliance with Apple's Developer Program License Agreement</li>
    </ul>

    <h2>Free and Pro tiers</h2>
    <p>Three tools are free with no account needed. Pro tools (customer reviews, sales reports) require a $19/month subscription managed through <a href="https://polar.sh">Polar.sh</a>.</p>

    <h2>Subscriptions</h2>
    <p>Pro subscriptions are billed monthly through Polar. You can cancel anytime through Polar's subscription management. Polar's terms of service apply to the payment process.</p>

    <h2>No warranty</h2>
    <p>This tool is provided as-is. We make no guarantees about uptime of the license validation server, accuracy of data from Apple's API, or compatibility with future API changes. You are responsible for verifying any data before acting on it.</p>

    <h2>Limitation of liability</h2>
    <p>To the maximum extent permitted by law, total liability is limited to the amount you paid in the 3 months before the event giving rise to the claim.</p>

    <h2>Your responsibilities</h2>
    <ul>
      <li>Keep your Apple API credentials (.p8 file) secure</li>
      <li>Keep your license key private</li>
      <li>Comply with Apple's terms when using data from their API</li>
    </ul>

    <h2>Changes</h2>
    <p>We may update these terms with reasonable notice. Continued use after changes constitutes acceptance.</p>

    <h2>Contact</h2>
    <p>Questions: povkonop@gmail.com</p>

    <p style="color:#888;font-size:13px;margin-top:40px">This project is not affiliated with, endorsed by, or sponsored by Apple Inc. Apple, App Store, App Store Connect, TestFlight, iOS, and macOS are trademarks of Apple Inc.</p>
  `, headers);
}

function handleDeletePage(headers: Record<string, string>): Response {
  return html(`
    <h1>Delete Your Data</h1>
    <p>Enter the email associated with your license to delete all your data from our systems.</p>
    <form method="POST" action="/delete">
      <input type="email" name="email" placeholder="you@example.com" required
        style="padding:10px;font-size:16px;width:300px;border:1px solid #555;border-radius:6px;background:#1a1a2e;color:#fff">
      <button type="submit"
        style="padding:10px 20px;font-size:16px;background:#dc2626;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-left:8px">
        Delete My Data
      </button>
    </form>
    <p style="color:#888;font-size:13px;margin-top:20px">This will permanently delete your email and license key from our database. Your subscription (if active) should be canceled separately through Polar.</p>
  `, headers);
}

async function handleDeleteRequest(
  request: Request,
  env: Env,
  headers: Record<string, string>,
): Promise<Response> {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return html("<h1>Email required</h1><p><a href='/delete'>Try again</a></p>", headers, 400);
  }

  await env.DB.prepare("DELETE FROM licenses WHERE email = ?").bind(email).run();

  return html(`
    <h1>Data Deleted</h1>
    <p>All license data associated with <strong>${escapeHtml(email)}</strong> has been removed from our systems.</p>
    <p>If you have an active Polar subscription, please cancel it separately at <a href="https://polar.sh">polar.sh</a>.</p>
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
