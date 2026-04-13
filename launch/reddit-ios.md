# r/iOSProgramming post

**Title:** I built a free MCP server for App Store Connect — check review status, read reviews from Claude Code / Cursor

**Body:**

If you use AI coding agents (Claude Code, Cursor, Windsurf), you can now talk to App Store Connect without leaving your editor.

**What it does:**

"Is my app in review?" → tells you the exact state with context ("Your app is in the review queue. Typical time: 24-48 hours.")

"Show me 1-star reviews from this week" → filtered customer reviews with ratings, text, territory

"What were my downloads yesterday?" → sales summary by app and territory

**Free tools (no account):**
- List all your apps
- App version history and build status
- Review status with human-readable context

**Pro tools ($19/mo):**
- Customer reviews with filtering/sorting
- Sales and download reports

**Setup takes 3 minutes:**
1. Create an API key in App Store Connect
2. `npm install -g @pofky/appstore-connect-mcp`
3. Add 3 env vars to your Claude/Cursor settings
4. Ask "list my apps"

Your .p8 private key stays on your machine. JWT tokens generated locally. Zero Apple data touches any remote server. Fully open source.

**GitHub:** https://github.com/pofky/appstore-connect-mcp
**npm:** `npm install -g @pofky/appstore-connect-mcp`

Other ASC MCP servers exist (STOMP has 162 tools, mcp-asc has 80+) but they're overwhelming if you just want the basics. This one focuses on the 5 things indie devs actually use.

What would you want added next — TestFlight management or responding to reviews?
