# App Store Connect MCP Server

> **The App Store Connect intelligence layer for your coding agent.** 11 tools that think, 3 slash-command workflows, and a bundled Claude Skill. Not another API wrapper.

Maintained successor to [JoshuaRileyDev/app-store-connect-mcp-server](https://github.com/JoshuaRileyDev/app-store-connect-mcp-server) (archived Feb 2026). Different angle, same API surface plus more.

```bash
npm install -g @pofky/asc-mcp
asc-mcp install-skill   # one-line, optional, for auto-routed review questions
```

## What Makes This Different

Other ASC MCP servers wrap the API and give you 80 to 293 raw endpoints. This one gives you 11 tools plus 3 Prompts plus a Skill that all think:

| You say | What happens |
|---------|-------------|
| "Run a preflight check on my app" | Audits metadata, character limits, screenshots, build status. Catches the issues that cause 40% of rejections. |
| "Give me a morning briefing" | Summarizes all your apps: who's in review, who got rejected, new low-rating reviews, action items. |
| "Generate release notes from my git history" | Reads commits since last tag, categorizes them, and gives you structured data to write "What's New" text. |
| "List my apps" | Shows all your iOS/macOS apps with bundle IDs |
| "Is my app in review?" | Exact review state with context ("typical time: 24-48 hours") |
| "Show me 1-star reviews" | Customer reviews filtered by rating, territory, sorted by date |
| "What were my downloads this week?" | Sales and revenue summary by territory |

No context switching. No portal. Just ask.

## Setup (3 minutes)

**Step 1.** Create an API key in [App Store Connect > Keys](https://appstoreconnect.apple.com/access/integrations/api) (Admin or App Manager role). Download the `.p8` file.

**Step 2.** Install:

```bash
npm install -g @pofky/asc-mcp
```

Add to `~/.claude/settings.json` (Claude Code) or your agent's MCP config:

```json
{
  "mcpServers": {
    "appstore-connect": {
      "command": "asc-mcp",
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

Works with **Claude Code**, **Cursor**, **Windsurf**, **Cline**, and any MCP-compatible client.

## Tools

### Free (no account needed)

| Tool | What it does |
|------|-------------|
| `list_apps` | List all your apps with name, bundle ID, SKU, platform |
| `app_details` | Version history, build status, release state, dates |
| `review_status` | Current review state with human-readable context |

### Pro ($9/mo)

| Tool | What it does | Why it matters |
|------|-------------|----------------|
| `list_reviews` | Customer reviews filtered by rating, territory, sort order | See what users say without opening the portal |
| `sales_report` | Daily/weekly/monthly downloads and revenue by territory | Know your numbers instantly |
| `release_preflight` | Pre-submission audit: metadata, char limits, screenshots, builds | Catches 40%+ of common rejection causes before you submit |
| `daily_briefing` | Morning summary across all apps: status, reviews, rejections | One call replaces 10 minutes of portal clicking |
| `release_notes` | Git commits since last tag, categorized for writing "What's New" | Your AI agent writes release notes from your actual changes |
| `keyword_insights` | Analyze keywords against iTunes search competition, difficulty ratings | See which keywords are worth targeting at a glance |
| `competitor_snapshot` | Look up any app: ratings, reviews, version, price, release notes | Competitive intelligence without leaving your editor |
| `metadata_diff` | Compare live vs pending version metadata across all locales | Verify exactly what changed before submitting |

**Coming next (Week 2):** LLM-powered review clustering via MCP Sampling, Elicitation-driven response drafts, rejection-risk scoring against the 2026 corpus.

[Get Pro](https://buy.polar.sh/polar_cl_Ta3OxEA1EbRyYNPFtSsRXgYWBCCtjwMxlbAeW35RLuu) | [Retrieve your license key](https://asc-mcp-license.remewdy.workers.dev/key)

## Slash Commands (Prompts)

Type these in Claude Desktop or Claude Code and the agent runs a pre-built multi-tool workflow:

| Slash command | What it does |
|---------------|--------------|
| `/asc-weekly-review` | Calls `daily_briefing` then `list_reviews` (low-rating, last 7 days) for every app, clusters themes, returns a single digest with 3-bullet action list. |
| `/asc-rejection-audit` | Given an `app_id`, calls `release_preflight` + `metadata_diff` + `review_status`, reads the result against the top 2026 rejection drivers (guideline 2.3 metadata, 4.0 design, privacy-AI 5.1.2). Produces Blocking / Likely-flagged / Safe sections. |
| `/asc-release-go-no-go` | Given an `app_id`, combines preflight + review queue + metadata diff + top competitors in the same category. Returns a direct GO or NO-GO with three supporting reasons. |

These are MCP Prompts per the [spec](https://modelcontextprotocol.io/docs/concepts/prompts/). Zero other App Store Connect MCP ships with them.

## Claude Skill (one-line install)

After installing the MCP, run:

```bash
asc-mcp install-skill
```

This copies a small `asc-review-triage` Skill to `~/.claude/skills/` so Claude automatically picks up review-related questions ("any bad reviews lately?", "what do my users say?", "ratings this week?") and calls the right ASC tools without you having to explain the workflow each time.

Works on macOS, Linux, and Windows. To remove: `asc-mcp uninstall-skill`.

## Real Output Examples

**"Run a preflight check before I submit"**
```
Release Preflight: v2.3

State: PREPARE_FOR_SUBMISSION
Platform: IOS

PASS (with 1 warning)

Warnings (recommended):
- Missing screenshot set for APP_IPHONE_67. May be required.

Passing checks: 4
- [en-US] Description OK (3874/4000 chars).
- [en-US] Keywords OK (96/100 chars).
- 2 screenshot set(s) found across 1 locale(s).
- Build 40 attached and valid.

Total: 4 pass, 1 warn, 0 fail
```

**"Morning briefing"**
```
Daily Briefing - 2026-04-13

2 apps in your account

Tempo: Habit Builder
- Latest: v2.3 (IOS) - Waiting for Review
- Action needed: v2.3 is Waiting for Review
- Reviews (last 3d): 5 new, avg 4.2 stars

NightOwl Weather
- Latest: v1.1 (IOS) - Live
- No new reviews in the last 3 days
```

**"Generate release notes from git"**
```
Git History for Release Notes

Since: v2.2.0
Commits: 8
Character limit: 4000 chars for "What's New"

New Features (3)
- feat: add habit streak calendar view
- feat: dark mode support
- add widget for home screen

Bug Fixes (2)
- fix: notification timing off by 1 hour
- fix: crash on iPad when rotating

Instructions: Write user-facing "What's New" text.
Lead with the most impactful change. Keep under 4000 chars.
```

## Why This One Over the Free Alternatives?

| | Raw API wrappers (free) | This server |
|---|---|---|
| **Tool count** | 80 to 293 | 11 opinionated tools |
| **MCP Prompts (slash commands)** | No | Yes, 3 pre-built workflows |
| **Claude Skill bundled** | No | Yes, one-line install |
| **Pre-submission audit** | No | Yes, catches rejections before you submit |
| **Cross-app briefings** | No | Yes, one call, all apps |
| **Git-aware release notes** | No | Yes, reads your project's commit history |
| **Smart review summaries** | No | Yes, theme clustering, action items |
| **Setup** | Build from source (Swift or Node) | `npm install -g` (any OS) |
| **Free tier** | Some | Yes, 3 tools, no account needed |

Raw wrappers give you endpoints. This gives you answers.

## Security

Your credentials never leave your machine:

- The `.p8` private key is read locally. JWT tokens are generated on your computer.
- API calls go directly from your machine to `api.appstoreconnect.apple.com`.
- The license server sees only your license key string. Zero Apple data, zero credentials.
- Fully open source. [Read the code.](https://github.com/pofky/asc-mcp)

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
