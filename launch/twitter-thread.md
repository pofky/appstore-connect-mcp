# X thread (v1.2.0)

Post sequence: 1 tweet every 45 seconds. Do not thread all at once, feels spammy.

## Tweet 1 (hook)

i used to tab-hop to app store connect 20 times a day just to check if my build was still in review.

built an MCP server so my coding agent can just answer it. 11 tools, 3 slash commands, a Claude Skill.

no other ASC MCP ships prompts or a skill. mine does.

## Tweet 2 (what you can actually say)

slash commands you can type in Claude Desktop:

/asc-weekly-review -> digest of all apps + low-rating reviews from last 7 days
/asc-rejection-audit <app_id> -> catches metadata / screenshot issues before Apple does
/asc-release-go-no-go <app_id> -> ships a GO or NO-GO with reasoning

## Tweet 3 (skill)

claude skills are the procedural knowledge layer. install ours with one command:

asc-mcp install-skill

then just ask "any bad reviews lately?" and claude auto-routes to the MCP, calls list_reviews + review_status, and summarizes by theme.

## Tweet 4 (why now)

JoshuaRileyDev's ASC MCP (the community favorite, 316 stars) got archived in Feb 2026. i am shipping the maintained successor with the AI-native layer his repo never got to.

## Tweet 5 (install + pricing)

install:
npm install -g @pofky/asc-mcp
asc-mcp install-skill

free tier = 3 tools. pro = $9/mo for the other 8 + slash commands + skill.

.p8 stays on your machine. Polar handles billing + VAT.

github.com/pofky/asc-mcp

## Tweet 6 (what is next)

week 2: MCP Sampling so the MCP asks your own Claude to cluster reviews + draft localized response replies. zero LLM bill for me, zero price hike for you.

week 3: rejection-risk scoring vs the 2026 corpus (guideline 2.3, 4.0, privacy-AI 5.1.2).

## Tweet 7 (reply-bait close)

if you ship iOS apps, what's the one thing you still check the ASC portal for that a coding agent should answer instead?

i will build the top 3 answers.
