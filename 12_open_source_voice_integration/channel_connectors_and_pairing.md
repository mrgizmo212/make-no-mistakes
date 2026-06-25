# Channel Connectors and Secure Device-Pairing Protocols

This document details the research findings for secure client-to-gateway pairing and platform-specific messaging channel connectors (SMS, Slack, Telegram, WhatsApp, Discord) in the context of building a modern, model-agnostic agent harness.

---

## 1. What Was Researched

1.  **Secure Device-Pairing Handshakes**: The cryptographic setup flow, setup payloads, URL-safe Base64 token encoding, client QR generation, gateway approval queues, and network security policies.
2.  **Platform Messaging Connectors**:
    *   **SMS (Twilio)**: Outbound POST dispatching and HTTP webhook HMAC-SHA1 signature verification.
    *   **Slack**: Inbound webhook signature verification (HMAC-SHA256), Block Kit layout rendering, and `thread_ts` thread-binding persistence.
    *   **Telegram**: Bot polling vs. webhook configurations, ingress spool queues, forum/topic threading, and inline callback action routing.
    *   **WhatsApp**: Socket-level web client emulation, QR string polling, auth credential caching, and outbound media payload scaling.
    *   **Discord**: WebSocket gateway loops, interaction component registries, and channel thread mappings.

---

## 2. Which Sources Were Used

| Source ID | Reference File | URL | Relevance | Purpose |
|:---|:---|:---|:---|:---|
| **[SRC-001]** | [openclaw/extensions/device-pair/index.ts](https://github.com/openclaw/openclaw/extensions/device-pair/index.ts) | https://github.com/openclaw/openclaw | **CRITICAL** | Handshake generation, setup payload, and cleartext policies |
| **[SRC-001]** | [openclaw/extensions/sms/src/twilio.ts](https://github.com/openclaw/openclaw/extensions/sms/src/twilio.ts) | https://github.com/openclaw/openclaw | **HIGH** | Twilio REST helper and X-Twilio-Signature verification |
| **[SRC-001]** | [openclaw/extensions/slack/src/channel.ts](https://github.com/openclaw/openclaw/extensions/slack/src/channel.ts) | https://github.com/openclaw/openclaw | **HIGH** | Slack web clients, Block Kit rendering, and thread caching |
| **[SRC-001]** | [openclaw/extensions/telegram/src/channel.ts](https://github.com/openclaw/openclaw/extensions/telegram/src/channel.ts) | https://github.com/openclaw/openclaw | **HIGH** | Telegram forum topic matching and update spool worker loops |
| **[SRC-001]** | [openclaw/extensions/whatsapp/src/login-qr.ts](https://github.com/openclaw/openclaw/extensions/whatsapp/src/login-qr.ts) | https://github.com/openclaw/openclaw | **HIGH** | WhatsApp socket hooks, QR code polling, and authentication stores |
| **[SRC-001]** | [openclaw/extensions/discord/src/channel.ts](https://github.com/openclaw/openclaw/extensions/discord/src/channel.ts) | https://github.com/openclaw/openclaw | **HIGH** | Discord REST endpoints, WebSocket listener, and slash interaction registry |

---

## 3. Key Findings

### A. The Device-Pairing Handshake Protocol

To link mobile companion apps (such as the OpenClaw iOS app) or remote CLI shells to a local/private agent gateway, a secure pairing handshake is used.

```
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
│ Gateway / Host  │             │ Channel Client  │             │   iOS App /     │
│  (OpenClaw DB)  │             │ (Telegram/Slack)│             │  Remote Node    │
└────────┬────────┘             └────────┬────────┘             └────────┬────────┘
         │                               │                               │
         │ 1. /pair qr                   │                               │
         ├──────────────────────────────▸│                               │
         │ Generate SetupPayload         │                               │
         │ Write QR Temp PNG             │                               │
         │                               │ 2. Dispatches QR Image        │
         │                               ├──────────────────────────────▸│
         │                               │                               │ (Scan QR Code)
         │                               │                               │ Decodes SetupPayload
         │                               │                               │
         │                               │                               │ 3. WebSocket Handshake
         │                               │                               │◄──────────────────────
         │                               │                               │   wss://gateway/pair
         │                               │                               │   Token: bootstrapToken
         │ 4. Places in Approval Queue   │                               │
         ├───────────────────────────────┼───────────────────────────────┤
         │ Status: pending               │                               │
         │ Notify Operator               │                               │
         │                               │                               │
         │ 5. /pair approve [requestId]  │                               │
         ├───────────────────────────────┼───────────────────────────────┤
         │ Generates persistent API key  │                               │
         │ Upgrades connection to active │                               │
         │                               │                               │
```

1.  **Setup Payload Generation**: The gateway generates a short-lived `SetupPayload` structure containing the gateway's public URL, a single-use cryptographically random bootstrap token, and an expiration timestamp `expiresAtMs` (typically 3 minutes) `[CLAIM-124](../00_index/citation_map.md#claim-124)`.
2.  **Payload Encoding**: The JSON payload is serialized, converted to a Base64 string, and normalized into a URL-safe format by replacing `+` with `-`, replacing `/` with `_`, and stripping any trailing padding characters `=` (`encodeSetupCode`) `[CLAIM-125](../00_index/citation_map.md#claim-125)`.
3.  **Visual Dispatch (QR Codes)**: The URL-safe setup code is converted into a QR PNG image using a temporary file system pipeline (`writeQrPngTempFile` inside a dedicated `device-pair-qr-` subfolder) `[CLAIM-126](../00_index/citation_map.md#claim-126)`. The gateway sends this image as media via the platform-specific connector's `sendMedia` adapter `[CLAIM-127](../00_index/citation_map.md#claim-127)`.
4.  **Pairing Network Policies**:
    *   Cleartext WebSockets (`ws://`) are strictly blocked for mobile setup codes unless the resolved gateway host is loopback (`localhost`/`::1`), the Android emulator bridge IP (`10.0.2.2`), or private LAN domains/addresses (`.local`, IPv4 `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, or `169.254.0.0/16` link-local) `[CLAIM-128](../00_index/citation_map.md#claim-128)`.
    *   Public connections, external domains, and Tailscale hosts force the use of secure WebSockets (`wss://`) to prevent credential sniffing on public networks `[CLAIM-128](../00_index/citation_map.md#claim-128)`.
5.  **Approval Queue Isolation**: When the companion client scans the QR code and initiates the WebSocket handshake, it sends the bootstrap token. The gateway validates the token, extracts the request, and queues it in a pending approvals list (`list.pending`) `[CLAIM-129](../00_index/citation_map.md#claim-129)`. An operator must explicitly approve it via a CLI trigger (`/pair approve [requestId]`) or via automated one-shot events (`armPairNotifyOnce`) before the client is granted a persistent API key `[CLAIM-129](../00_index/citation_map.md#claim-129)`.

---

### B. Twilio SMS Connector

*   **Outbound Transport**: SMS dispatches are sent as POST requests to `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json` using HTTP Basic Authentication (`AccountSid:AuthToken`) `[CLAIM-130](../00_index/citation_map.md#claim-130)`. Payload parameters must include the recipient (`To`), text body (`Body`), and either a Twilio sender phone number (`From`) or a messaging service identifier (`MessagingServiceSid`) `[CLAIM-130](../00_index/citation_map.md#claim-130)`.
*   **Webhook Signature Verification**: Incoming SMS webhooks must verify origin authenticity to prevent spoofing. The connector retrieves the `X-Twilio-Signature` header, reconstructs the request URL, appends all url-encoded form body parameters sorted alphabetically by key, hashes the concatenated string using the account's `AuthToken` via SHA-1 HMAC, and executes a timing-safe check (`timingSafeEqual`) against the signature `[CLAIM-131](../00_index/citation_map.md#claim-131)`.

---

### C. Slack Connector

*   **Inbound Security**: Validates incoming events by reading `X-Slack-Signature` and `X-Slack-Request-Timestamp`. It hashes the timestamp and request raw body using the app's `Slack Signing Secret` via HMAC-SHA256 and verifies the result `[CLAIM-132](../00_index/citation_map.md#claim-132)`.
*   **Layout Translation (Block Kit)**: The connector translates agent-generated Markdown text, interactive elements, and thinking signatures into Slack **Block Kit** JSON layouts `[CLAIM-132](../00_index/citation_map.md#claim-132)`. Large content outputs are formatted as accessory elements or collapsed attachments to prevent chat log clutter.
*   **Thread Mapping (`thread_ts`)**: Conversation session threads are anchored using Slack's `thread_ts` parameter. The connector writes outbound message-to-session relationships into a `sent-thread-cache.ts` cache to route subsequent user inputs and agent responses to the correct thread `[CLAIM-132](../00_index/citation_map.md#claim-132)`.

---

### D. Telegram Connector

*   **Inbound Spooling & Workers**: To prevent performance degradation under concurrent message spikes, Telegram updates are spooled to a central queue (`telegram-ingress-spool.ts`) and ingested asynchronously by dedicated workers (`telegram-ingress-worker.ts`) `[CLAIM-133](../00_index/citation_map.md#claim-133)`.
*   **Forum Topic Threading**: Telegram supports multi-topic forum groups. The connector uses `parseTelegramTopicConversation` to resolve sub-threads by creating canonical session keys mapped as `chatId:topicId` `[CLAIM-134](../00_index/citation_map.md#claim-134)`. This isolates agent conversations into separate topics within the same chat group.
*   **Interactive Callbacks**: Action menus, parameter overrides, and pairing approval confirmations are routed via Telegram's inline keyboards and `callback_query` answer loops.

---

### E. WhatsApp Connector

*   **Socket Client Emulation**: Since WhatsApp does not offer a public websocket protocol for personal clients, the connector implements WhatsApp Web client socket hooks (using Baileys or similar engines) `[CLAIM-135](../00_index/citation_map.md#claim-135)`.
*   **QR Authentication Loop**: The backend spawns a socket connection that emits raw QR strings dynamically. The `login-qr.ts` controller captures these strings, renders them as temporary data-URLs, and updates the state. Once scanned, the authenticated credentials (`creds.json`) are cached in a local `auth-store` folder for silent reconnections `[CLAIM-135](../00_index/citation_map.md#claim-135)`.
*   **Media Compression**: Outbound screenshots or document uploads are automatically compressed (e.g. converting heavy PNG/TIFF images to JPEG formats) to prevent WhatsApp socket limits from rejecting the transaction.

---

### F. Discord Connector

*   **WebSocket Gateway**: Runs a persistent gateway loop that captures incoming channel events (mentions, direct messages, reactions) and translates them into uniform inbound agent contexts.
*   **Interactive UI Primitives**: Standardises Discord component layouts (buttons, action bars, select dropdowns) to handle inline operator approvals and parameter configurations directly inside Discord channel threads.

---

## 4. Technology Summary Matrix

| Metric / Feature | Twilio SMS | Slack | Telegram | WhatsApp | Discord |
|:---|:---|:---|:---|:---|:---|
| **Protocol / Transport** | HTTP REST (POST) | Webhook Ingress / Web API | Webhook or Long Polling | WebSocket (WA Web Emulation) | Web API / WS Gateway |
| **Auth Verification** | HMAC-SHA1 (`X-Twilio-Signature`) | HMAC-SHA256 (`X-Slack-Signature`) | Token match (`getMe` probe) | QR Scanned Token + cached creds | Token Header + WS handshakes |
| **Session Binding** | Phone Number mapping | `thread_ts` identifier | `chatId` / `topicId` | Phone `JID` / group ID | Channel ID / thread ID |
| **Media Constraints** | MMS url limits / No native blocks | URL uploads / Block Kit | Spooled downloads / Native stickers | Scaling / Auto-JPEG compression | REST uploads / Embed layouts |
| **Pairing Support** | Setup code text | QR via Slack `sendMedia` | QR via telegram `sendMedia` | QR polled on socket | QR via discord `sendMedia` |

---

## 5. Harness Design Recommendations

1.  **Uniform Gateway Ingress Interface**: Connectors must translate platform-specific update shapes into a unified, model-agnostic `InboundEvent` interface.
2.  **Enforce Secure Handshakes**: Pairing bootstrap tokens must be short-lived (<5 mins) and one-shot, and cleartext `ws://` connections must be strictly disallowed outside loopback/private LAN networks.
3.  **Asynchronous Spooling for Webhooks**: Webhook adapters (Telegram, Slack) must write inbound payloads to a local DB queue immediately and respond with `HTTP 200` to prevent timeouts, leaving execution loops to asynchronous workers.
4.  **Context-Aware Thread Caches**: Store chat thread identifiers (e.g., Slack's `thread_ts`, Telegram's `topicId`, WhatsApp's `JID`) alongside the agent session database to route replies correctly.

---

## 6. Channel Connectors Gotchas & Failure Modes

Production deployments across messaging and voice gateways encounter several critical failure points:

### A. Twilio Webhook Signature Verification Gotchas
*   **Gotcha**: Webhook signature verification fails mysteriously when deploying behind reverse proxies, load balancers, or serverless API gateways. This happens because:
    1.  **URL Mismatches**: Twilio calculates the `X-Twilio-Signature` using the exact, absolute URL requested by their servers. If your reverse proxy terminates SSL, changes the protocol from `https://` to `http://`, modifies the host header, or strips/appends trailing slashes, the local verification string will mismatch.
    2.  **Query Parameter Sorting**: If query parameters are present in the webhook URL, they must be included in the verification payload. Standard signature helpers require passing the exact parameters that were present in the incoming HTTP request.
*   **Mitigation**: Standardize proxy configuration to pass headers like `X-Forwarded-Proto` and `X-Forwarded-Host`. Programmatically reconstruct the incoming absolute URL by inspecting proxy headers before passing it to the validation library. Ensure parameters are parsed programmatically without relying on regex query string splitters.

### B. WhatsApp Web Client Emulation (Socket) Gotchas
*   **Gotcha**: WebSocket-based client emulators (like Baileys or WhatsApp-Web.js) are highly prone to connection drops and sudden state changes:
    1.  **Unstable Authentication Flags**: The `creds.json` auth state contains dynamic keys and session tokens. If the connection drops during a write operation, the credentials file can become corrupted or desynchronized, leading to infinite socket reconnection loops.
    2.  **Meta API Changes**: WhatsApp frequently rolls out changes to their web application. Since these emulators reverse-engineer the private protocol, minor frontend updates by Meta can break the client library overnight, leading to failing websocket handshakes.
    3.  **Shadow Banning**: Sending rapid, automated automated agent outputs through personal WhatsApp accounts easily triggers spam filters, resulting in immediate number bans.
*   **Mitigation**:
    1.  **Robust Auth Storage**: Implement transactions or double-buffered writes when updating `creds.json` (write to a temporary file and atomic-rename to avoid corruptions on crash).
    2.  **Gateway Health Checking**: Implement auto-restart policies on socket crashes and regular ping-pong tests to verify gateway connection health.
    3.  **Rate Limiting & Human-like Jitter**: Introduce randomized delays (e.g. 1-3 seconds) between agent reasoning updates to mimic human typing and avoid automated ban triggers.

### C. Regex Command Parsing Gotchas
*   **Gotcha**: Developers often write complex regular expressions to parse incoming message commands and slash parameters (e.g., trying to parse `/pair approve <id>` or token overrides from chat strings). If a user adds a newline, markdown formatting, emojis, or slightly deviates from the syntax, the regex match fails or exhibits catastrophic backtracking.
*   **Mitigation**: Minimize regular expressions in incoming message routing and processing:
    1.  **Programmatic Lexers**: Split inputs programmatically (e.g., splitting by whitespace or token indexing) to parse CLI-like parameters.
    2.  **LLM-Based Routing**: For flexible interaction, feed the raw message to a lightweight classifier or use LLM-based intent parsing rather than hardcoded pattern matching. Deterministic routing is acceptable only for basic exact prefix matching (e.g., `text.startsWith('/pair')`).

