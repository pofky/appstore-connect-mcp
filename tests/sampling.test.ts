import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sample, clientSupportsSampling } from "../src/sampling.js";

function makeServer() {
  return new McpServer(
    { name: "t", version: "0.0.0" },
    { capabilities: { tools: {}, prompts: {} } },
  );
}

function stubSamplingCapability(server: McpServer, enabled: boolean) {
  // @ts-expect-error private test override
  server.server.getClientCapabilities = () =>
    enabled ? { sampling: {} } : {};
}

function stubCreateMessage(
  server: McpServer,
  impl: (...a: unknown[]) => Promise<unknown>,
) {
  // @ts-expect-error private test override
  server.server.createMessage = impl;
}

describe("sampling helper", () => {
  it("returns unsupported when client has no sampling capability", async () => {
    const server = makeServer();
    stubSamplingCapability(server, false);
    const r = await sample(server, { user: "hi", maxTokens: 100 });
    expect(r.ok).toBe(false);
    expect((r as { unsupported: boolean }).unsupported).toBe(true);
  });

  it("returns text when client supports sampling", async () => {
    const server = makeServer();
    stubSamplingCapability(server, true);
    stubCreateMessage(server, async () => ({
      role: "assistant",
      content: { type: "text", text: "hello world" },
      model: "fake-model",
      stopReason: "end_turn",
    }));
    const r = await sample(server, { user: "hi", maxTokens: 100 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.text).toBe("hello world");
      expect(r.model).toBe("fake-model");
    }
  });

  it("extracts text from an array of content blocks", async () => {
    const server = makeServer();
    stubSamplingCapability(server, true);
    stubCreateMessage(server, async () => ({
      role: "assistant",
      content: [
        { type: "text", text: "first" },
        { type: "text", text: "second" },
      ],
      model: "fake-model",
    }));
    const r = await sample(server, { user: "hi", maxTokens: 100 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.text).toBe("first\nsecond");
  });

  it("returns error on timeout", async () => {
    const server = makeServer();
    stubSamplingCapability(server, true);
    stubCreateMessage(
      server,
      () => new Promise((resolve) => setTimeout(resolve, 1000)),
    );
    const r = await sample(server, { user: "hi", maxTokens: 100, timeoutMs: 20 });
    expect(r.ok).toBe(false);
    expect((r as { error: string }).error).toMatch(/timed out/i);
  });

  it("returns error on empty content", async () => {
    const server = makeServer();
    stubSamplingCapability(server, true);
    stubCreateMessage(server, async () => ({
      role: "assistant",
      content: { type: "text", text: "" },
      model: "fake-model",
    }));
    const r = await sample(server, { user: "hi", maxTokens: 100 });
    expect(r.ok).toBe(false);
    expect((r as { error: string }).error).toMatch(/no text/i);
  });

  it("capability detection handles missing getClientCapabilities gracefully", () => {
    const server = makeServer();
    // Do not stub: raw McpServer returns {} on getClientCapabilities by default
    expect(typeof clientSupportsSampling(server)).toBe("boolean");
  });
});
