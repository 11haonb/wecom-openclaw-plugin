# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-01-31

### 🎉 Initial Release

First stable release of WeCom OpenClaw Integration.

### Features

#### Core Messaging
- ✅ Text message send/receive
- ✅ Image message send/receive (with auto-download)
- ✅ Voice message send/receive (AMR format)
- ✅ Video message send/receive
- ✅ File message send/receive
- ✅ Location message receive
- ✅ Link message receive
- ✅ Emotion/sticker receive

#### Message Cards
- ✅ Text card messages
- ✅ News article messages
- ✅ MP news messages
- ✅ Template card messages

#### Group Chat Support
- ✅ Group message handling
- ✅ @mention detection
- ✅ Configurable mention requirement
- ✅ Group allowlist
- ✅ Per-user permissions in groups

#### Remote Browser Control
- ✅ Integration with OpenClaw Browser Tool
- ✅ Node Host remote proxy support
- ✅ Full browser automation (navigate, click, type, screenshot, etc.)

#### Multi-Account Support
- ✅ Multiple WeCom apps simultaneously
- ✅ JSON-based configuration
- ✅ Per-account settings

#### Event Handling
- ✅ Subscribe/unsubscribe events
- ✅ Menu click events
- ✅ QR code scan events
- ✅ Location select events
- ✅ Custom event handlers
- ✅ Welcome message configuration

#### Mini Program Integration
- ✅ Mini program notice messages
- ✅ Mini program card messages
- ✅ Template card with mini program jump

#### Security
- ✅ AES-256-CBC message encryption
- ✅ SHA1 signature verification
- ✅ Message deduplication
- ✅ Nonce validation

### Documentation
- ✅ Comprehensive README (English + Chinese)
- ✅ Quick Start Guide (Chinese)
- ✅ Browser Control Guide
- ✅ API Reference

---

## Roadmap

### Planned Features
- [ ] Voice message transcription (speech-to-text)
- [ ] Interactive message cards with button callbacks
- [ ] Scheduled messages
- [ ] Message recall support
- [ ] User profile caching
- [ ] Analytics and logging dashboard

### Under Consideration
- [ ] WeChat Pay integration
- [ ] External contact support
- [ ] Customer service session management
- [ ] Approval workflow integration
