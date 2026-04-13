# Twitter/X launch thread

## Tweet 1 (hook)
I got tired of switching to App Store Connect every time I needed to check review status.

So I built an MCP server that lets Claude Code talk to Apple's API directly.

"Is my app in review?" — answered in 2 seconds, no tab switching.

Open source: github.com/pofky/appstore-connect-mcp

## Tweet 2 (what it does)
5 tools, free tier:
- list_apps — see all your apps
- app_details — versions, builds, states
- review_status — in review? approved? rejected?

Pro ($19/mo):
- list_reviews — customer reviews with filtering
- sales_report — downloads + revenue

## Tweet 3 (security)
Your .p8 private key never leaves your machine.

JWT tokens generated locally. Our license server only sees a license key string — zero Apple data.

No cloud dependency. Everything runs as a local Node process next to Claude.

## Tweet 4 (setup)
Setup in 3 min:

1. Create API key in App Store Connect
2. npm install -g appstore-connect-mcp
3. Add to Claude settings.json
4. Ask: "Is Remewdy in review?"

Works with Claude Code, Cursor, or any MCP-compatible agent.

## Tweet 5 (CTA)
If you're an iOS dev using AI coding agents, give it a try:

github.com/pofky/appstore-connect-mcp

Feedback welcome — TestFlight management and metadata updates coming next.
