import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { elicit, clientSupportsElicitation } from "../src/elicitation.js";

function makeServer() {
  return new McpServer(
    { name: "t", version: "0.0.0" },
    { capabilities: { tools: {}, prompts: {} } },
  );
}

function stubElicitCap(server: McpServer, enabled: boolean) {
  // @ts-expect-error private test override
  server.server.getClientCapabilities = () =>
    enabled ? { elicitation: {} } : {};
}

function stubElicitInput(server: McpServer, impl: (...a: unknown[]) => Promise<unknown>) {
  // @ts-expect-error private test override
  server.server.elicitInput = impl;
}

const schema = { type: "object" as const, properties: { foo: { type: "string" } } };

describe("elicitation helper", () => {
  it("returns unsupported when capability missing", async () => {
    const server = makeServer();
    stubElicitCap(server, false);
    const r = await elicit(server, { message: "hi", schema });
    expect(r.ok).toBe(false);
    expect((r as { unsupported: boolean }).unsupported).toBe(true);
  });

  it("returns values on accept", async () => {
    const server = makeServer();
    stubElicitCap(server, true);
    stubElicitInput(server, async () => ({ action: "accept", content: { foo: "bar" } }));
    const r = await elicit(server, { message: "hi", schema });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.values.foo).toBe("bar");
  });

  it("returns declined flag on decline", async () => {
    const server = makeServer();
    stubElicitCap(server, true);
    stubElicitInput(server, async () => ({ action: "decline" }));
    const r = await elicit(server, { message: "hi", schema });
    expect(r.ok).toBe(false);
    expect((r as { declined: boolean }).declined).toBe(true);
  });

  it("returns cancelled flag on cancel", async () => {
    const server = makeServer();
    stubElicitCap(server, true);
    stubElicitInput(server, async () => ({ action: "cancel" }));
    const r = await elicit(server, { message: "hi", schema });
    expect(r.ok).toBe(false);
    expect((r as { cancelled: boolean }).cancelled).toBe(true);
  });

  it("capability check does not throw for missing impl", () => {
    const server = makeServer();
    expect(typeof clientSupportsElicitation(server)).toBe("boolean");
  });
});
