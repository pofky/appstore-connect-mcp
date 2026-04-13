# Show HN: MCP server for App Store Connect – manage iOS apps from Claude Code

I built an MCP server that connects Claude Code (or any MCP-compatible AI agent) to Apple's App Store Connect API.

Free tier gives you: list apps, check version details, see review status.
Pro tier ($19/mo): read customer reviews with filtering, download sales reports.

Your .p8 private key never leaves your machine — JWT tokens are generated locally.

Setup takes about 3 minutes: create an API key in ASC, npm install, add to your Claude settings.

GitHub: https://github.com/pofky/appstore-connect-mcp

Built this because I manage two iOS apps (Remewdy and GeoWrecked) and got tired of context-switching to the ASC portal every time I wanted to check review status or read user feedback during a coding session.

There are a few other ASC MCP servers (STOMP has 162 tools, mcp-asc has 80+), but they're kitchen-sink approaches. This one intentionally focuses on the 5 things indie devs actually use daily.

Would love feedback on which tools to add next — TestFlight management and metadata updates are on the roadmap.
