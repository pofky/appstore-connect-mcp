/**
 * MCP Sampling helper.
 *
 * Calls `server.createMessage(...)` on the underlying MCP Server so the
 * user's own client runs the LLM request. Zero cost to us (we do not pay
 * for the user's Anthropic tokens).
 *
 * Capability detection: we check the client's declared capabilities at
 * initialize time. If sampling is not advertised, the caller gets a
 * structured `{ unsupported: true }` response and must degrade gracefully.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CreateMessageResult,
  ModelPreferences,
} from "@modelcontextprotocol/sdk/types.js";

export type SamplingResult =
  | { ok: true; text: string; model: string; stopReason: string | undefined }
  | { ok: false; unsupported: true }
  | { ok: false; error: string };

export interface SamplingRequest {
  system?: string;
  user: string;
  maxTokens: number;
  temperature?: number;
  modelPreferences?: ModelPreferences;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export function clientSupportsSampling(server: McpServer): boolean {
  try {
    const caps = server.server.getClientCapabilities();
    return Boolean(caps?.sampling);
  } catch {
    return false;
  }
}

export async function sample(
  server: McpServer,
  req: SamplingRequest,
): Promise<SamplingResult> {
  if (!clientSupportsSampling(server)) {
    return { ok: false, unsupported: true };
  }

  const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const messages = [
    {
      role: "user" as const,
      content: { type: "text" as const, text: req.user },
    },
  ];

  try {
    const result: CreateMessageResult = (await withTimeout(
      server.server.createMessage({
        messages,
        systemPrompt: req.system,
        maxTokens: req.maxTokens,
        temperature: req.temperature,
        modelPreferences: req.modelPreferences,
      }),
      timeoutMs,
    )) as CreateMessageResult;

    const text = extractText(result);
    if (!text) {
      return { ok: false, error: "Sampling returned no text content." };
    }
    return {
      ok: true,
      text,
      model: result.model ?? "unknown",
      stopReason: result.stopReason,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

function extractText(result: CreateMessageResult): string {
  const content = result.content;
  if (!content) return "";
  if (Array.isArray(content)) {
    const textBlocks = content.filter(
      (b): b is { type: "text"; text: string } =>
        typeof b === "object" && b !== null && (b as { type?: string }).type === "text",
    );
    return textBlocks.map((b) => b.text).join("\n").trim();
  }
  if (typeof content === "object" && content !== null) {
    const maybeBlock = content as { type?: string; text?: string };
    if (maybeBlock.type === "text" && typeof maybeBlock.text === "string") {
      return maybeBlock.text.trim();
    }
  }
  return "";
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Sampling timed out after ${ms}ms`));
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

export const MODEL_HINTS = {
  fast: {
    speedPriority: 0.6,
    costPriority: 0.3,
    intelligencePriority: 0.1,
  } satisfies ModelPreferences,
  balanced: {
    speedPriority: 0.4,
    costPriority: 0.3,
    intelligencePriority: 0.3,
  } satisfies ModelPreferences,
  smart: {
    speedPriority: 0.2,
    costPriority: 0.2,
    intelligencePriority: 0.6,
  } satisfies ModelPreferences,
};
