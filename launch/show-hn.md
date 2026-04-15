# Show HN drafts for @pofky/asc-mcp v1.2.0

## DECISION REQUIRED BEFORE POSTING

v1.3.0 shipped Sampling. Option A is the active draft.

**Title (Option A, honest as of v1.3.0):** `Show HN: An App Store Connect MCP that actually thinks, with Sampling, Prompts, and a Claude Skill, not another API wrapper`

Honest title at post time is critical. HN rings nuke accounts. Do not claim a feature that is not merged. v1.3.0 has Prompts + Skill + Sampling live on npm.

Post day: Tuesday 14:00 UTC. First-comment prep below. Mod-rule reminders at the bottom.

---

## Body (use with either title)

I have a few iOS apps and kept tab-hopping to App Store Connect to answer the same five questions every day. Review status. New 2-star reviews. What rejected last week. What my daily downloads look like. The portal is fine but Safari is not where I write code.

So I built @pofky/asc-mcp, an MCP server for the App Store Connect API. It is not a raw wrapper. Competing ASC MCPs ship 80 to 293 raw tool endpoints that eat your context budget without helping you. This one ships 11 opinionated tools and three pre-built workflows that actually answer the question you asked.

**What is in v1.2.0:**

- 11 tools: list apps, app details, review status (free), plus list_reviews, sales_report, release_preflight, daily_briefing, release_notes, keyword_insights, competitor_snapshot, metadata_diff (Pro).
- 3 MCP Prompts (slash commands in Claude Desktop or Claude Code): `/asc-weekly-review`, `/asc-rejection-audit`, `/asc-release-go-no-go`. Each seeds the agent with the exact multi-tool sequence to run. Zero other ASC MCP ships Prompts.
- 1 Claude Skill, `asc-review-triage`. One-line install via `asc-mcp install-skill`. Claude auto-loads it when you ask about reviews. Zero other ASC MCP ships a Skill.

**Positioning:** maintained successor to JoshuaRileyDev's app-store-connect-mcp-server, which was archived in February 2026. I kept the tool-surface familiar and added the AI-native layer his repo never got to.

**Pricing:** free tier is 3 tools (list apps, app details, review status). Pro is $9/mo for the other 8 plus the Prompts and Skill. Polar is the merchant of record, so VAT and consumer-rights compliance are handled.

**Security:** your `.p8` private key is read locally. JWT tokens generated on your machine. API calls go direct to api.appstoreconnect.apple.com. The license server sees only the license-key string, zero Apple data, zero credentials.

Install:

```
npm install -g @pofky/asc-mcp
asc-mcp install-skill
```

Source: https://github.com/pofky/asc-mcp

Happy to answer questions, especially on the Prompts + Skill design. I want to know if anyone else is shipping MCP Prompts yet. I could not find a single ASC competitor that does.

---

## First comment (always reply-first to your own post for signaling)

If you are wondering why the Pro tier is $9, it is because there are six free ASC MCP alternatives already. I am not competing on price. I am competing on what the AI actually does with the data. That is why Pro gates the workflows and the Skill, not basic endpoints. If you want just the API wrapper, the free tier covers it.

Full feature list and why I think MCP Prompts matter: [link to README section].

---

## Mod-rule reminders

- No superlatives in the title ("fastest", "best", "first"). Instant downvote signal on HN.
- No emoji.
- Title under 80 chars. Both options are within that.
- Do not DM friends asking for upvotes. HN detects rings and bans permanently.
- First comment goes in within 5 minutes of posting.
- Respond to every comment within the first hour.
- If a mod changes your title, do not re-post.
