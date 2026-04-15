# r/iOSProgramming post (v1.2.0)

**Subreddit rules check:** r/iOSProgramming bans pure promotional posts. Post here only if you have prior comment karma in the sub or after engaging in the weekly "What are you working on?" thread for two weeks first. Otherwise, post to r/iOSProgramming's weekly showcase thread instead.

**Title:** I built an MCP server for App Store Connect that ships Prompts and a Claude Skill, not another API wrapper

**Body:**

If you manage iOS apps and use Claude Code, Cursor, or any MCP client, you have probably tried wiring App Store Connect in and hit the same wall I did: the existing MCP servers dump 80 to 293 raw API tools into the agent's context and the agent has no idea which one to call for the question you just asked.

I shipped a different take. @pofky/asc-mcp v1.2.0 has 11 opinionated tools plus three slash-command workflows plus a Claude Skill. All of it is about getting the agent to do the right thing without you having to explain the tool sequence.

**Why I built it:** the big community ASC MCP (JoshuaRileyDev's) was archived in February. I wanted something maintained that also added the intelligence layer his repo never got to.

**What is in it:**

- 11 tools: `list_apps`, `app_details`, `review_status` (free), plus `list_reviews`, `sales_report`, `release_preflight`, `daily_briefing`, `release_notes`, `keyword_insights`, `competitor_snapshot`, `metadata_diff` (Pro)
- 3 MCP Prompts (slash commands): `/asc-weekly-review`, `/asc-rejection-audit`, `/asc-release-go-no-go`
- 1 Claude Skill, auto-routes review questions to the MCP
- `release_preflight` catches the metadata + screenshot + build issues that drive about 40% of rejections

**Security:** your `.p8` stays local. JWT tokens generated on your machine. API calls go directly to Apple. License server sees only a license-key string.

**Pricing:** free tier is 3 tools, no account. Pro is $9 a month for the other 8 plus workflows plus Skill. Polar handles billing and VAT.

**Install:**

```
npm install -g @pofky/asc-mcp
asc-mcp install-skill
```

GitHub: https://github.com/pofky/asc-mcp

Happy to hear what workflows would actually help you. I have `/asc-pricing-check` on the roadmap plus subscription health, and next week I am shipping Sampling so the MCP can ask your own Claude to cluster reviews by theme without me paying for LLM tokens.
