/**
 * MCP Elicitation helper.
 *
 * Lets a tool ask the user structured questions mid-call via
 * `server.elicitInput(...)`. The client renders a dialog with the schema.
 *
 * Capability detection: if the client does not advertise elicitation, we
 * return `{ unsupported: true }` so the caller can fall back to a default.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type ElicitationResult =
  | { ok: true; values: Record<string, unknown> }
  | { ok: false; unsupported: true }
  | { ok: false; declined: true }
  | { ok: false; cancelled: true }
  | { ok: false; error: string };

export interface ElicitationSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
}

export interface ElicitationRequest {
  message: string;
  schema: ElicitationSchema;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;

export function clientSupportsElicitation(server: McpServer): boolean {
  try {
    const caps = server.server.getClientCapabilities();
    return Boolean(caps?.elicitation);
  } catch {
    return false;
  }
}

export async function elicit(
  server: McpServer,
  req: ElicitationRequest,
): Promise<ElicitationResult> {
  if (!clientSupportsElicitation(server)) {
    return { ok: false, unsupported: true };
  }

  const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const result = (await withTimeout(
      server.server.elicitInput({
        mode: "form",
        message: req.message,
        requestedSchema: req.schema as never,
      }),
      timeoutMs,
    )) as { action: "accept" | "decline" | "cancel"; content?: Record<string, unknown> };

    if (result.action === "decline") return { ok: false, declined: true };
    if (result.action === "cancel") return { ok: false, cancelled: true };
    if (result.action !== "accept") {
      return { ok: false, error: `Unknown elicit action: ${result.action}` };
    }
    return { ok: true, values: result.content ?? {} };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Elicitation timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
