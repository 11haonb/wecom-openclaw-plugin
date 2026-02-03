# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **TypeScript plugin** for OpenClaw that integrates WeCom (企业微信/WeChat Work) as a communication channel. It enables AI agents to communicate via WeCom, handle rich media messages, and provide remote browser control from mobile devices.

**Key Technologies:**
- TypeScript (ES2022, NodeNext modules)
- Node.js >= 18
- Vitest for testing
- OpenClaw plugin SDK (peer dependency >= 2026.1.26)

## Installation

This plugin has been refactored to use only the public `openclaw/plugin-sdk` API and can now be installed as a standalone npm package.

### Installing the Plugin

**From npm (recommended):**
```bash
openclaw plugins install wecom-openclaw-integration
```

**From local directory (development):**
```bash
# Copy plugin files
openclaw plugins install /path/to/wecom-openclaw-plugin

# Or link for active development (no copying)
openclaw plugins install -l /path/to/wecom-openclaw-plugin
```

**From archive:**
```bash
openclaw plugins install ./wecom-openclaw-integration-1.0.0.tgz
```

### Managing the Plugin

```bash
# List all plugins
openclaw plugins list

# Enable the plugin
openclaw plugins enable wecom

# Disable the plugin
openclaw plugins disable wecom

# Update plugin (if installed from npm)
openclaw plugins update wecom
```

**Important:** After installation or configuration changes, restart the OpenClaw Gateway for changes to take effect.

## Refactoring History

**Version 1.0.0+** - This plugin has been refactored to use only the public `openclaw/plugin-sdk` API, following the pattern established by the [Feishu plugin](https://github.com/m1heng/clawdbot-feishu).

**Key changes:**
- Replaced internal API imports with `PluginRuntime` methods
- Uses `runtime.channel.reply.dispatchReplyFromConfig()` instead of internal dispatcher
- Uses `runtime.channel.routing.resolveAgentRoute()` for routing
- Uses `runtime.channel.reply.formatAgentEnvelope()` for message formatting
- Uses `runtime.channel.text.*` utilities for text chunking and markdown handling
- Created `reply-dispatcher.ts` following the Feishu plugin pattern

**Benefits:**
- ✅ Can be installed as a standalone npm package
- ✅ No longer requires OpenClaw workspace installation
- ✅ Uses stable public APIs instead of internal modules
- ✅ Easier to maintain and update

## Build and Development Commands

### Building
```bash
# This plugin is built as part of the OpenClaw workspace
# From the OpenClaw root directory:
pnpm build

# TypeScript compilation outputs to ./dist/
# Entry point: index.ts
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test test/api.test.ts

# Watch mode
pnpm test -- --watch
```

### Running the Plugin
```bash
# Start OpenClaw gateway with this plugin enabled
node dist/entry.js gateway

# The plugin loads automatically if enabled in ~/.openclaw/openclaw.json
```

## Architecture

### Plugin Structure

This is an **OpenClaw ChannelPlugin** that implements bidirectional communication with WeCom:

```
┌─────────────────────────────────────────────────────────┐
│                    OpenClaw Runtime                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │              WeCom Plugin (index.ts)               │ │
│  │  - Registers channel                               │ │
│  │  - Sets up HTTP webhook handler                    │ │
│  │  - Initializes event system                        │ │
│  └────────────────────────────────────────────────────┘ │
│           │                                    │          │
│           ▼                                    ▼          │
│  ┌─────────────────┐              ┌──────────────────┐  │
│  │  WeComChannel   │              │  HTTP Webhook    │  │
│  │  (channel.ts)   │              │  (monitor.ts)    │  │
│  │  - Send msgs    │              │  - Receive msgs  │  │
│  │  - Media upload │              │  - Decrypt       │  │
│  └─────────────────┘              │  - Verify sig    │  │
│           │                        └──────────────────┘  │
│           ▼                                    │          │
│  ┌─────────────────────────────────────────────────────┐│
│  │           WeComApiClient (api.ts)                   ││
│  │  - Token management                                 ││
│  │  - HTTP requests to WeCom API                       ││
│  │  - Media upload/download                            ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                  WeCom API Servers
```

### Core Modules

**index.ts** (Plugin Entry Point)
- Registers the plugin with OpenClaw
- Sets up HTTP webhook handler at `/wecom/callback`
- Initializes event system and mini program support
- Validates WeCom credentials on startup

**src/channel.ts** (242 lines)
- Implements `ChannelPlugin` interface for OpenClaw
- Handles outbound message sending
- Manages channel capabilities and configuration

**src/monitor.ts** (refactored)
- HTTP webhook handler for WeCom callbacks
- Message decryption (AES-256-CBC) and signature verification (SHA1)
- Message deduplication
- Uses public `PluginRuntime` API to dispatch messages to OpenClaw
- Handles routing, envelope formatting, and history management

**src/reply-dispatcher.ts** (new)
- Creates reply dispatcher for sending responses back to WeCom
- Handles text chunking, markdown table conversion
- Manages media payload delivery (images, files, videos)
- Integrates with OpenClaw's typing callbacks and human delay system
- Follows the pattern from the Feishu plugin

**src/api.ts** (857 lines)
- WeCom API client with automatic token refresh
- Methods for sending text, images, voice, video, files, cards
- Media upload/download handling
- Token caching and expiration management

**src/crypto.ts** (134 lines)
- AES-256-CBC encryption/decryption for message security
- SHA1 signature verification for webhook authenticity
- PKCS7 padding implementation

**src/parser.ts** (165 lines)
- XML message parsing using fast-xml-parser
- Extracts message content, user info, and metadata
- Handles various message types (text, image, voice, video, file, location, link, event)

**src/events.ts** (284 lines)
- Event handling system for WeCom events (subscribe, click, scan, location)
- Custom event handler registration
- Welcome message support for new users

**src/mention.ts** (130 lines)
- Detects @mentions in group chats
- Configurable bot names and aliases
- Strips mention text from messages

**src/group-policy.ts** (151 lines)
- Group chat access control
- Allowlist management for group conversations
- Determines if bot should respond in group context

**src/multi-account.ts** (312 lines)
- Manages multiple WeCom applications simultaneously
- Account-specific configuration and API clients
- Routes messages to correct account

**src/miniprogram.ts** (316 lines)
- Mini program card integration
- Template messages and notices
- Mini program client wrapper

**src/quote.ts** (168 lines)
- Message quoting/reply functionality
- Extracts quoted message context

**src/runtime.ts** (21 lines)
- Stores OpenClaw runtime context
- Provides access to browser control and other runtime features

**src/types.ts** (230 lines)
- TypeScript type definitions for all WeCom message types
- API request/response types
- Configuration schemas

## Message Flow

### Incoming Messages (WeCom → OpenClaw)

1. WeCom sends encrypted XML to webhook endpoint
2. `monitor.ts` receives POST request at `/wecom/callback`
3. Decrypt message body using AES-256-CBC
4. Verify SHA1 signature
5. Parse XML to extract message content
6. Check for duplicates (message deduplication)
7. Handle @mentions in group chats
8. Dispatch to OpenClaw runtime for AI processing

### Outgoing Messages (OpenClaw → WeCom)

1. OpenClaw runtime calls channel's `send()` method
2. `channel.ts` formats message for WeCom API
3. `api.ts` sends HTTP request to WeCom API
4. Handles media upload if needed (images, files, etc.)
5. Returns success/failure status

## Configuration

The plugin requires these environment variables in `~/.openclaw/openclaw.json`:

```json
{
  "env": {
    "WECOM_CORP_ID": "ww1234567890abcdef",
    "WECOM_CORP_SECRET": "your-app-secret",
    "WECOM_AGENT_ID": "1000001",
    "WECOM_CALLBACK_TOKEN": "your-token",
    "WECOM_CALLBACK_AES_KEY": "your-43-character-aes-key"
  },
  "plugins": {
    "entries": {
      "wecom": { "enabled": true }
    }
  }
}
```

**Optional Configuration:**
- `WECOM_BOT_NAME` - Bot name for @mention detection
- `WECOM_BOT_ALIASES` - Comma-separated aliases
- `WECOM_WELCOME_MESSAGE` - Auto-reply for new subscribers
- `WECOM_CALLBACK_PORT` - Webhook port (default: 18789)
- `WECOM_CALLBACK_PATH` - Webhook path (default: /wecom/callback)

## Remote Browser Control

This plugin integrates with OpenClaw's browser control feature:

1. User sends command via WeCom (e.g., "打开浏览器访问淘宝")
2. Message flows to OpenClaw AI agent
3. AI agent uses browser tools to control remote PC
4. Screenshots/results sent back via WeCom

**Requirements:**
- `browser.enabled: true` in OpenClaw config
- Node Host running on target PC: `openclaw node run --host SERVER_IP --port 18789`
- Gateway configured with `gateway.nodes.browser.mode: "auto"`

## Security Implementation

**Message Encryption:**
- AES-256-CBC with PKCS7 padding
- 43-character base64-encoded AES key from WeCom
- Random 16-byte IV prepended to ciphertext

**Signature Verification:**
- SHA1 HMAC with callback token
- Validates: token + timestamp + nonce + encrypted_msg
- Prevents replay attacks and tampering

**Message Deduplication:**
- Tracks message IDs to prevent duplicate processing
- Important for webhook retries

## Testing

Test files use Vitest with mocking:

- **test/api.test.ts** - API client, token management, HTTP requests
- **test/channel.test.ts** - Channel plugin interface
- **test/crypto.test.ts** - Encryption/decryption, signature verification
- **test/monitor.test.ts** - Webhook handling, message parsing
- **test/parser.test.ts** - XML parsing, message extraction

**Running specific tests:**
```bash
pnpm test test/crypto.test.ts  # Test encryption only
pnpm test -- --grep "signature"  # Test signature verification
```

## Common Development Patterns

### Adding a New Message Type

1. Add type definition to `src/types.ts`
2. Add parsing logic to `src/parser.ts`
3. Add sending method to `src/api.ts`
4. Update channel capabilities in `src/channel.ts`
5. Add tests

### Adding a New Event Handler

```typescript
// In your code or index.ts
import { onEvent } from "./src/events.js";

onEvent("click", async (event, config) => {
  // Handle menu click event
  console.log(`Menu clicked: ${event.eventKey}`);
});
```

### Multi-Account Support

```typescript
import { getAccountManager } from "./src/multi-account.js";

const manager = getAccountManager();
manager.addAccount("account1", config1);
manager.addAccount("account2", config2);

// Messages automatically routed to correct account
```

## Important Notes

- **Module System**: Uses ES modules (`.js` extensions in imports even for `.ts` files)
- **TypeScript Config**: `noImplicitAny: false` - some APIs have loose typing
- **Workspace Dependency**: This plugin expects to be in an OpenClaw pnpm workspace
- **Webhook Endpoint**: Must be publicly accessible for WeCom to send callbacks
- **Token Refresh**: Access tokens expire after 7200 seconds, automatically refreshed by `api.ts`

## Documentation

- **docs/** - Docsify documentation site (bilingual)
- **docs-site/** - Mintlify documentation site
- **README.md** - User-facing documentation with quick start guide
- **CHANGELOG.md** - Version history and release notes

## Debugging

**Enable verbose logging:**
```bash
DEBUG=wecom:* node dist/entry.js gateway
```

**Check webhook connectivity:**
```bash
curl -X POST http://localhost:18789/wecom/callback \
  -H "Content-Type: text/xml" \
  -d '<xml>...</xml>'
```

**Verify token refresh:**
- Tokens cached in memory with expiration tracking
- Check logs for "Token refreshed" messages
- Token endpoint: `https://qyapi.weixin.qq.com/cgi-bin/gettoken`
