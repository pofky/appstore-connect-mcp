# r/iOSProgramming post

**Title:** I built an MCP server for App Store Connect - check review status from Claude Code

**Body:**

I manage two iOS apps and got frustrated constantly switching to the ASC portal during coding sessions just to check if my build was still in review or to read customer reviews.

So I built an MCP server (Model Context Protocol) that connects Claude Code directly to Apple's App Store Connect API.

**What it does:**
- list_apps - see all your apps with bundle IDs
- app_details - versions, build status, release state
- review_status - current review status with helpful context ("Your app is currently being reviewed by Apple. Typical review time is 24-48 hours.")
- list_reviews - customer reviews with star rating filtering (Pro)
- sales_report - download and revenue summaries (Pro)

**Security:** Your .p8 private key stays on your machine. JWT tokens generated locally. The only thing our server sees is a license key string.

**Setup:** ~3 minutes. Create an ASC API key, npm install, add to Claude settings.

**Pricing:** Free tier (3 tools) works with no account. Pro ($19/mo) unlocks reviews + sales reports.

**GitHub:** https://github.com/pofky/appstore-connect-mcp

Would love to know what other ASC features you'd want - TestFlight management and metadata updates are next on my list.
