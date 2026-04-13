# appstore-connect-mcp

MCP server for Apple App Store Connect. Manage your iOS and macOS apps directly from Claude Code, Cursor, or any MCP-compatible AI agent.

**Check review status. Read customer reviews. Download sales reports. All from your AI agent.**

## Quick Start

```bash
npm install -g @pofky/appstore-connect-mcp
```

Add to your Claude Code MCP config (`~/.claude/settings.json`):

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

Then ask Claude:

> "Is my app in review?"
> "Show me the latest 1-star reviews"
> "What were my downloads last week?"

## Setup (3 minutes)

1. Go to [App Store Connect > Keys](https://appstoreconnect.apple.com/access/integrations/api)
2. Click **Generate API Key** (requires Admin or App Manager role)
3. Download the `.p8` file and save it somewhere safe (e.g. `~/.appstore/`)
4. Copy your **Key ID** and **Issuer ID** from the same page
5. Configure the MCP server with those values (see Quick Start above)

## Tools

### Free

| Tool | Description |
|------|-------------|
| `list_apps` | List all apps with name, bundle ID, platform |
| `app_details` | Version history, build status, release state |
| `review_status` | Current App Store review status with context |

### Pro ($19/mo)

| Tool | Description |
|------|-------------|
| `list_reviews` | Customer reviews with filtering and sorting |
| `sales_report` | Download/sales/revenue summary reports |

Get a Pro license at [agentcost.dev/pricing](https://agentcost.dev/pricing), then add `ASC_LICENSE_KEY` to your env.

## Examples

**List your apps:**
```
> List my App Store Connect apps

Found 2 app(s):

- **Remewdy** (com.remewdy.app) — ID: 6504493441
- **GeoWrecked** (app.geowrecked.ios) — ID: 6478291556
```

**Check review status:**
```
> Is Remewdy in review?

## Review Status for App 6504493441

**Latest version**: v2.1.0 (IOS)
**State**: Ready for Sale
**Created**: 2026-04-10

Your latest version is live on the App Store. No pending reviews.
```

**Read customer reviews (Pro):**
```
> Show me recent 1-star reviews for GeoWrecked

## Customer Reviews (3 shown)

### ★☆☆☆☆ App crashes on launch
**By** user123 — US — 2026-04-12
The app crashes immediately after the splash screen...
```

## Why This One?

Other ASC MCP servers exist but have gaps:
- **JoshuaRileyDev** (316 stars) — archived, no longer maintained
- **STOMP** (162 tools) — kitchen-sink approach, complex setup
- **mcp-asc** — active but no freemium tier

This server is focused on the 5 things indie iOS devs actually need, with a free tier that works immediately and a Pro tier for power users.

## Security

- Your `.p8` private key **never leaves your machine**. JWT tokens are generated locally.
- The license server only sees your license key string — zero Apple data.
- No credentials are stored on any remote server.

## Requirements

- Node.js 18+
- Apple Developer Program membership ($99/yr)
- App Store Connect API key (Admin or App Manager role)

## License

MIT
