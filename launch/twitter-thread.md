# Twitter/X launch thread

## Tweet 1 (hook)
I got tired of switching to App Store Connect to check review status while coding.

So I built an MCP server that lets Claude Code (or Cursor/Windsurf) talk to Apple's API:

"Is my app in review?"
"Show me 1-star reviews"
"What were my downloads?"

Free and open source: github.com/pofky/appstore-connect-mcp

## Tweet 2 (what it does)
5 tools. 3 free, 2 pro.

Free:
- list_apps — all your apps + bundle IDs
- app_details — versions, builds, release state
- review_status — "Your app is in the review queue. Typical time: 24-48 hours."

Pro ($19/mo):
- list_reviews — filter by stars, sort, territory
- sales_report — downloads + revenue

## Tweet 3 (setup)
Setup in 3 minutes:

1. Create API key in App Store Connect
2. npm install -g @pofky/appstore-connect-mcp
3. Add 3 env vars to Claude settings
4. "List my apps"

Works with Claude Code, Cursor, Windsurf, Cline — any MCP client.

## Tweet 4 (security)
Your .p8 key never leaves your machine.

JWT tokens generated locally. API calls go directly from your computer to Apple. Our license server only sees a license key string.

Fully open source — read every line.

## Tweet 5 (CTA)
If you ship iOS apps and use AI coding agents:

npm install -g @pofky/appstore-connect-mcp

Free tier works immediately. No account needed.

github.com/pofky/appstore-connect-mcp

What tool should I add next — TestFlight management or review responses?
