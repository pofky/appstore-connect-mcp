# App Store Connect MCP Server

> **The missing MCP server for iOS developers.** Check app review status, read customer reviews, and download sales reports - directly from Claude Code, Cursor, Windsurf, or any MCP-compatible AI agent. No more switching to the App Store Connect portal.

```bash
npm install -g @pofky/appstore-connect-mcp
```

## What Can It Do?

Ask your AI agent in plain English:

| You say | What happens |
|---------|-------------|
| "List my apps" | Shows all your iOS/macOS apps with bundle IDs |
| "Is my app in review?" | Tells you the exact review state with context |
| "What version is live?" | Shows version history with release dates |
| "Show me 1-star reviews" | Lists customer reviews filtered by rating |
| "What were my downloads this week?" | Sales and revenue summary by territory |

No context switching. No portal. Just ask.

## Setup (3 minutes)

**Step 1.** Create an API key in [App Store Connect > Keys](https://appstoreconnect.apple.com/access/integrations/api) (Admin or App Manager role). Download the `.p8` file.

**Step 2.** Install and configure:

```bash
npm install -g @pofky/appstore-connect-mcp
```

Add to `~/.claude/settings.json` (Claude Code) or your agent's MCP config:

```json
{
  "mcpServers": {
    "appstore-connect": {
      "command": "appstore-connect-mcp",
      "env": {
        "ASC_KEY_ID": "YOUR_KEY_ID",
        "ASC_ISSUER_ID": "YOUR_ISSUER_ID",
        "ASC_PRIVATE_KEY_PATH": "~/.appstore/AuthKey_XXXX.p8"
      }
    }
  }
}
```

**Step 3.** Ask your agent: "List my App Store Connect apps"

That's it. Works with **Claude Code**, **Cursor**, **Windsurf**, **Cline**, and any MCP-compatible client.

## Tools

### Free (no account needed)

| Tool | What it does |
|------|-------------|
| `list_apps` | List all your apps - name, bundle ID, SKU, platform |
| `app_details` | Full version history, build status, release state, dates |
| `review_status` | Current review state: in review, waiting, approved, rejected - with human-readable context like "Your app is currently being reviewed. Typical time: 24-48 hours." |

### Pro ($19/mo)

| Tool | What it does |
|------|-------------|
| `list_reviews` | Customer reviews with star rating filter (1-5), sort by newest/oldest/rating, territory filter |
| `sales_report` | Daily/weekly/monthly download counts, revenue, proceeds by territory and app |

**Coming soon:** respond to reviews, update metadata, manage TestFlight, financial reports.

[Get Pro](https://buy.polar.sh/polar_cl_Ta3OxEA1EbRyYNPFtSsRXgYWBCCtjwMxlbAeW35RLuu) | [Retrieve your license key](https://asc-mcp-license.remewdy.workers.dev/key)

## Real Output Examples

**"List my apps"**
```
Found 2 app(s):

- Remewdy: Pet Med Tracker (com.remewdy.app) - ID: 6761487030
- GeoWrecked - World Trivia (app.geowrecked.ios) - ID: 6759347056
```

**"Is Remewdy in review?"**
```
Review Status for App 6761487030

Latest version: v1.0 (IOS)
State: Waiting for Review
Created: 2026-04-01

Your app is in the review queue. It has not been picked up by a reviewer yet.
```

**"Show me recent 1-star reviews for my app"**
```
Customer Reviews (3 shown)

★☆☆☆☆ App crashes on launch
By user123 - US - 2026-04-12
The app crashes immediately after the splash screen...
```

## Why This One?

Other App Store Connect MCP servers exist. Here's how this compares:

| Server | Tools | Status | Free tier | Focused |
|--------|-------|--------|-----------|---------|
| JoshuaRileyDev | ~25 | Archived (Feb 2026) | N/A | No |
| STOMP | 162 | Active | No | No |
| mcp-asc | 80+ | Active | No | No |
| **This one** | **5** | **Active** | **Yes** | **Yes** |

This server does 5 things well instead of 162 things poorly. Free tier works immediately - install and go. Pro unlocks reviews and sales when you need them.

## Security

Your credentials never leave your machine:

- The `.p8` private key is read locally. JWT tokens are generated on your computer.
- API calls go directly from your machine to `api.appstoreconnect.apple.com`.
- Our license server sees only your license key string - zero Apple data, zero credentials.
- Fully open source. [Read the code.](https://github.com/pofky/appstore-connect-mcp)

## Works With

- [Claude Code](https://claude.ai/code) (Anthropic)
- [Cursor](https://cursor.com)
- [Windsurf](https://codeium.com/windsurf)
- [Cline](https://github.com/cline/cline)
- Any client supporting the [Model Context Protocol](https://modelcontextprotocol.io)

## Requirements

- Node.js 18+
- Apple Developer Program membership
- App Store Connect API key (Admin or App Manager role)

## Legal

- [Privacy Policy](https://asc-mcp-license.remewdy.workers.dev/privacy)
- [Terms of Service](https://asc-mcp-license.remewdy.workers.dev/terms)

This project is not affiliated with, endorsed by, or sponsored by Apple Inc. Apple, App Store, App Store Connect, TestFlight, iOS, and macOS are trademarks of Apple Inc.

## License

MIT
