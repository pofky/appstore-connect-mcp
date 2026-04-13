# r/iOSProgramming

**Title:** Made a simple MCP server for App Store Connect — check review status from your editor

I manage two iOS apps and was getting annoyed by how often I'd switch to the ASC website just to check if my build was in review or to read a new review someone left.

So I built an MCP server that brings that into Claude Code / Cursor / Windsurf.

You can ask things like:
- "Is my app in review?" — gives you the status in plain language, not just a state code
- "Show me my 1-star reviews" — filtered reviews right in your terminal
- "What were my downloads this week?" — quick sales summary

Three tools are free (list apps, app details, review status). Reviews and sales reports are $19/mo since I need to keep the lights on.

Your API key stays on your machine — the server generates JWT tokens locally and talks to Apple directly. The only thing that hits my infrastructure is a license check.

Takes about 3 minutes to set up: create an API key in ASC, install via npm, add a few env vars.

`npm install -g @pofky/appstore-connect-mcp`

Source: https://github.com/pofky/appstore-connect-mcp

There are bigger ASC MCP servers out there (STOMP has 162 tools) but I just wanted something simple that covers what I actually check daily. Open to suggestions on what to add next.
