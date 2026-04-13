# Twitter/X thread

## Tweet 1
Got tired of switching to App Store Connect every time I wanted to check if my app was still in review.

Built an MCP server so I can just ask from my editor: "is Remewdy in review?"

Free, open source: github.com/pofky/asc-mcp

## Tweet 2
What it does:

- "list my apps" - shows your apps with bundle IDs
- "is my app in review?" - tells you the status in plain English
- "show me 1-star reviews" - customer feedback right in your terminal
- "what were my downloads?" - sales numbers

First 3 are free.

## Tweet 3
Setup is like 3 minutes. Create an API key in App Store Connect, npm install, add to your claude/cursor config. That's it.

Your .p8 key stays on your machine. Nothing goes through my servers except a license check.

npm install -g @pofky/asc-mcp

## Tweet 4
I know there are other ASC MCP servers (STOMP has 162 tools). I just wanted the five things I actually check as an indie dev. Not trying to wrap the entire Apple API.

What would you add? Thinking TestFlight next.
