# font mcp

an expert design advisor mcp that finds, pairs, and sets up the best fonts for your project.

## how it works

it starts when you ask for a "vibe" or point it at a website. instead of searching a static database, it fires off parallel research agents to finding trending discussions on reddit and expert examples from typewolf.

once it understands what you need, it presents a curated list of fonts. if you choose a paid font, it verifies you have a license and then helps you hunt down the actual files for testing. finally, it generates the exact tailwind or css code to drop it into your project.

## installation

**opencode**
tell opencode:
> fetch and follow instructions from https://raw.githubusercontent.com/microck/font-mcp/master/.opencode/INSTALL.md

**codex / cursor / other**
tell your agent:
> fetch and follow instructions from https://raw.githubusercontent.com/microck/font-mcp/master/.codex/INSTALL.md

## what's inside

### live research
searches reddit (`r/typography`, `r/web_design`) and design archives for real-world usage examples from the last year.

### project scanning
analyzes your `package.json` and config files to detect your project's "vibe" (e.g., "tech startup" vs "luxury fashion").

### steal this look
scans any website url to identify what fonts they are using (even hidden adobe/typekit ones).

### auto-setup
generates tailwind or css config for your chosen font.

### font hunter
attempts to find testing/trial files for paid fonts (if you confirm you have a license).

## legal warning

**read this before using.**

this tool includes a "font hunter" feature that helps you find font files for testing. **you must own a valid license** for any commercial font you use.

- downloading fonts you haven't paid for is piracy.
- this tool assumes you have purchased a license and simply need the files for local dev.
- the creators of this tool accept no liability for misuse. **pay your type designers.**

## license

mit
