# Show HN: I made an MCP server so I can check my App Store review status without leaving my editor

I have two iOS apps and I was constantly switching to the App Store Connect website just to see if my build was still stuck in review. It got annoying enough that I built an MCP server to bring that info into my coding environment.

Now I just ask "is my app in review?" and get the answer right there. No tab switching, no logging into ASC.

It connects to Apple's App Store Connect API using your own API key (the .p8 file stays on your machine, tokens are generated locally).

What it does:
- List your apps
- See version details and build status
- Check review status - it tells you stuff like "your app is in the queue, hasn't been picked up yet" instead of just showing a status code
- Read customer reviews (paid)
- Pull sales/download numbers (paid)

The first three are free. Reviews and sales are $9/mo because those hit Apple's API more heavily and I need to cover my costs.

Works with Claude Code, Cursor, Windsurf, or anything that speaks MCP.

Install: npm install -g @pofky/asc-mcp

Source: https://github.com/pofky/asc-mcp

There are a few other ASC MCP servers out there (STOMP, mcp-asc) but they try to wrap the entire API - 100+ tools. I just wanted the five things I actually check every day.

Happy to hear what else would be useful. I'm thinking about adding TestFlight management next.
