#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ASCClient } from "./client.js";
import { validateLicense } from "./license.js";
import { registerPrompts } from "./prompts.js";
import { installSkill, uninstallSkill } from "./skill-installer.js";
import type { ASCConfig, Tier } from "./types.js";

import { listApps } from "./tools/list-apps.js";
import { appDetails } from "./tools/app-details.js";
import { reviewStatus } from "./tools/review-status.js";
import { listReviews } from "./tools/list-reviews.js";
import { salesReport } from "./tools/sales-report.js";
import { releasePreflight } from "./tools/release-preflight.js";
import { dailyBriefing } from "./tools/daily-briefing.js";
import { releaseNotes } from "./tools/release-notes.js";
import { keywordInsights } from "./tools/keyword-insights.js";
import { competitorSnapshot } from "./tools/competitor-snapshot.js";
import { metadataDiff } from "./tools/metadata-diff.js";

const SERVER_VERSION = "1.2.0";

function getConfig(): ASCConfig {
  const keyId = process.env.ASC_KEY_ID;
  const issuerId = process.env.ASC_ISSUER_ID;
  const privateKeyPath = process.env.ASC_PRIVATE_KEY_PATH;

  if (!keyId || !issuerId || !privateKeyPath) {
    console.error(
      "Missing required environment variables:\n" +
        "  ASC_KEY_ID       — Your API key ID from App Store Connect\n" +
        "  ASC_ISSUER_ID    — Your team's issuer ID\n" +
        "  ASC_PRIVATE_KEY_PATH — Path to your .p8 private key file\n\n" +
        "Create an API key at:\n" +
        "  https://appstoreconnect.apple.com/access/integrations/api",
    );
    process.exit(1);
  }

  return {
    keyId,
    issuerId,
    privateKeyPath,
    licenseKey: process.env.ASC_LICENSE_KEY,
  };
}

async function main() {
  const config = getConfig();
  const client = new ASCClient(config);
  const tier: Tier = await validateLicense(config.licenseKey);

  if (tier === "pro") {
    console.error(`asc-mcp ${SERVER_VERSION}: Pro license active. All tools available.`);
  } else {
    console.error(
      `asc-mcp ${SERVER_VERSION}: Free tier (3 tools). Upgrade at https://buy.polar.sh/polar_cl_Ta3OxEA1EbRyYNPFtSsRXgYWBCCtjwMxlbAeW35RLuu`,
    );
  }

  const server = new McpServer(
    {
      name: "asc-mcp",
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    },
  );

  // --- Free tools ---

  /** Wrap a tool handler so API errors return messages instead of crashing. */
  function safe(fn: (...a: any[]) => Promise<string>) {
    return async (...a: any[]) => {
      try {
        return { content: [{ type: "text" as const, text: await fn(...a) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Error: ${msg}` }] };
      }
    };
  }

  server.tool(
    "list_apps",
    "List all apps in your App Store Connect account with name, bundle ID, and platform.",
    { limit: z.number().optional().describe("Max apps to return (default 50, max 200)") },
    safe((args) => listApps(client, args)),
  );

  server.tool(
    "app_details",
    "Get detailed info about an app including versions, build status, and release state.",
    { app_id: z.string().regex(/^\d+$/, "App ID must be numeric").describe("App Store Connect app ID (use list_apps to find it)") },
    safe((args) => appDetails(client, args)),
  );

  server.tool(
    "review_status",
    "Check the current App Store review status — in review, waiting, approved, or rejected.",
    { app_id: z.string().regex(/^\d+$/, "App ID must be numeric").describe("App Store Connect app ID") },
    safe((args) => reviewStatus(client, args)),
  );

  // --- Pro tools (gated) ---

  server.tool(
    "list_reviews",
    "List customer reviews for an app. Filter by rating. Pro feature.",
    {
      app_id: z.string().regex(/^\d+$/, "App ID must be numeric").describe("App Store Connect app ID"),
      rating: z.number().min(1).max(5).optional().describe("Filter by star rating (1-5)"),
      limit: z.number().optional().describe("Max reviews (default 20, max 100)"),
      sort: z.enum(["newest", "oldest", "rating_high", "rating_low"]).optional()
        .describe("Sort order (default: newest)"),
    },
    safe((args) => listReviews(client, args, tier)),
  );

  server.tool(
    "sales_report",
    "Download sales/downloads summary. Shows units, proceeds, territory. Pro feature.",
    {
      vendor_number: z.string().describe("Vendor number from Payments and Financial Reports"),
      frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional()
        .describe("Report frequency (default: DAILY)"),
      report_date: z.string().optional()
        .describe("Date in YYYY-MM-DD (daily) or YYYY-MM (monthly). Default: yesterday."),
    },
    safe((args) => salesReport(client, args, tier)),
  );

  // --- Intelligence tools (Pro) ---

  server.tool(
    "release_preflight",
    "Pre-submission audit: checks metadata, character limits, screenshots, build status. Catches rejection causes before you submit.",
    { app_id: z.string().regex(/^\d+$/, "App ID must be numeric").describe("App Store Connect app ID") },
    safe((args) => releasePreflight(client, args, tier)),
  );

  server.tool(
    "daily_briefing",
    "Morning briefing across all apps: version status, recent reviews, rejections, action items. One call for full situational awareness.",
    { days: z.number().optional().describe("Look back N days for reviews (default 3)") },
    safe((args) => dailyBriefing(client, args, tier)),
  );

  server.tool(
    "release_notes",
    "Extract git commits since last tag and return structured data for writing App Store 'What's New' text. Categorizes changes and provides writing guidelines.",
    {
      project_path: z.string().optional().describe("Path to git project (default: current directory)"),
      since_tag: z.string().optional().describe("Git tag to diff from (default: latest tag)"),
      max_commits: z.number().optional().describe("Max commits to include (default 50)"),
    },
    safe((args) => releaseNotes(args, tier)),
  );

  server.tool(
    "keyword_insights",
    "Analyze your app's keywords against search competition. Shows difficulty, competing apps, and budget usage. Uses iTunes Search API.",
    {
      app_id: z.string().regex(/^\d+$/, "App ID must be numeric").describe("App Store Connect app ID"),
      extra_keywords: z.string().optional().describe("Extra comma-separated keywords to analyze beyond current metadata"),
    },
    safe((args) => keywordInsights(client, args, tier)),
  );

  server.tool(
    "competitor_snapshot",
    "Look up any app on the App Store: ratings, reviews, version, price, category, release notes. Search by name or App Store ID.",
    {
      query: z.string().describe('App name (e.g. "Medisafe") or numeric App Store ID'),
      country: z.string().optional().describe("Two-letter country code (default: us)"),
    },
    safe((args) => competitorSnapshot(args, tier)),
  );

  server.tool(
    "metadata_diff",
    "Compare metadata between your live and pending app versions. Shows what changed in descriptions, keywords, and release notes across locales.",
    {
      app_id: z.string().regex(/^\d+$/, "App ID must be numeric").describe("App Store Connect app ID"),
    },
    safe((args) => metadataDiff(client, args, tier)),
  );

  // --- Prompts (slash commands in Claude Desktop / Code) ---
  const prompts = registerPrompts(server);
  console.error(
    `asc-mcp: ${prompts.length} prompt(s) registered: ${prompts.map((p) => "/" + p.name).join(", ")}`,
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function dispatchCli(argv: string[]): number | null {
  const cmd = argv[2];
  if (!cmd) return null;
  if (cmd === "install-skill") return installSkill();
  if (cmd === "uninstall-skill") return uninstallSkill();
  if (cmd === "--version" || cmd === "-v" || cmd === "version") {
    console.log(SERVER_VERSION);
    return 0;
  }
  if (cmd === "--help" || cmd === "-h" || cmd === "help") {
    console.log(`asc-mcp ${SERVER_VERSION}

Usage:
  asc-mcp                  Run as an MCP server on stdio (for Claude Desktop/Code).
  asc-mcp install-skill    Install the asc-review-triage Claude Skill.
  asc-mcp uninstall-skill  Remove the asc-review-triage Claude Skill.
  asc-mcp version          Print version.
  asc-mcp help             This help.`);
    return 0;
  }
  return null;
}

const cliResult = dispatchCli(process.argv);
if (cliResult !== null) {
  process.exit(cliResult);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
