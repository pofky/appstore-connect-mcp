# Show HN: MCP server for App Store Connect – check review status from Claude Code

I built an MCP server that lets you manage your iOS apps directly from AI coding agents (Claude Code, Cursor, Windsurf, Cline).

Instead of switching to the App Store Connect portal to check if your build is in review or read user feedback, just ask your agent:

- "Is my app in review?" → exact status with context
- "Show me 1-star reviews" → filtered, sorted customer reviews
- "What were my downloads this week?" → sales summary by territory

Free tier: list apps, app details, review status — works immediately with no account.
Pro ($19/mo): customer reviews + sales reports.

Your .p8 private key never leaves your machine. JWT tokens generated locally. Zero Apple data touches our servers.

npm install -g @pofky/appstore-connect-mcp

Setup takes 3 minutes: create an API key in ASC, install, add to your Claude settings.

GitHub: https://github.com/pofky/appstore-connect-mcp

Other ASC MCP servers exist (STOMP has 162 tools, mcp-asc has 80+), but they're overwhelming. This one focuses on the 5 things you actually need daily as an indie iOS dev.

Would love to know what tools to add next — TestFlight management and review responses are on the roadmap.
