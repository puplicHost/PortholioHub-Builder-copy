# integrate-payment-gateway — 2026 Upgrade Plan

## Summary of 2026 Standards Changes

### Machine Payments Protocol (MPP) — Stripe + Tempo (March 2026)
- **Open protocol** for agents to pay programmatically without checkout UI
- **HTTP 402 Payment Required** flow: Agent requests resource → Server returns 402 with payment requirements → Agent authorizes payment → Retries request with payment credential → Server verifies and returns resource
- **Payment methods**: Shared Payment Tokens (SPTs) for cards, stablecoins (USDC on Tempo blockchain), x402 protocol
- **Stripe MPP integration**: PaymentIntents API, `automatic_payment_methods: { enabled: true }`, off-session SetupIntents with `setup_future_usage: "off_session"`
- **mppx SDK** for validation: `npx mppx@latest validate http://localhost:4242`

### x402 Protocol (2025-2026)
- **Internet-native HTTP-based payment standard** for machine-to-machine payments
- **HTTP 402** with `payment-required` header (base64-encoded payment requirements)
- **Crypto payments**: USDC on Base network, facilitator via Coinbase Developer Platform (CDP)
- **Stripe support**: `2026-05-27.preview` API version, `crypto` payment method with `mode: transaction_verification`
- **Deposit addresses**: `POST /v1/crypto/deposit_addresses` with network=tempo

### Stripe Roadmap 2026 (Q3/Q4)
- **Dynamic pricing for x402 and MPP** (public preview, global)
- **Session payments** for usage-based billing (token consumption, API invocations)
- **Standalone 3DS** (general availability, global)
- **Multi-account MCP** (private preview)
- **Shared Payment Tokens** (GA Q4 2026, US)
- **Wero payments** (private preview, global)

### BNPL & Subscription BNPL (2026)
- **Buy Now Pay Later** messaging elements on product detail/cart pages (stripe-payment-method-messaging)
- **Subscription BNPL** for recurring payments beyond retail installments
- **Flow**: Consumer pays initial installment → BNPL provider pays merchant → Consumer makes subsequent payments via bank rails (ACH, direct debit, A2A) or card rails

### A2A (Account-to-Account) Pay by Bank
- **Bank-to-bank direct rails**: TrueLayer, Plaid, Stripe Pay by Bank
- **Lower card processing fees**
- **Slow-settling transactions**: Manage intermediate status webhooks (processing, pending, settled) in DB state machine
- **Inventory TTL lock** while waiting for bank settlement

### Programmatic Agent Payments (x402 / MPP)
- **HTTP 402 / MPP** for machine-to-machine / autonomous AI agent checkouts
- **No interactive frontend redirects**
- **Stripe Machine Payments Protocol (MPP)** or SetupIntents with `setup_future_usage: "off_session"`

### PCI DSS v4.0.1 Webhook Requirements
- **Webhook signature verification**: HMAC over raw unparsed payload before JSON parsing
- **Constant-time comparison** (`crypto.timingSafeEqual` / `hmac.compare_digest`)
- **Replay attack prevention**: Reject events with timestamp older than 300 seconds
- **Queue-first ingestion**: Return 200 OK within 500ms after persisting raw event; offload to async worker (Kafka, Cloudflare Queues, RabbitMQ)
- **Dual-write idempotency guard**: Unique DB index on `(provider, event_id, event_type)` + distributed lock (Redis Redlock or Postgres Advisory Lock)

---

## Required Skill Upgrades

### 1. Core Rules Updates
| Current Rule | 2026 Upgrade |
|--------------|--------------|
| Webhook handling generic | **Queue-first ingestion** (200 OK within 500ms), async worker offload, dual-write idempotency guard |
| Payment methods static | **Dynamic payment methods** (`automatic_payment_methods: { enabled: true }`) |
| Agent payments mention | **Full MPP/x402 specification** with HTTP 402 flow, SPTs, stablecoins, off-session SetupIntents |
| BNPL mention | **BNPL messaging elements** on PDP/cart with dynamic price/currency/country |
| A2A mention | **Full A2A flow** with intermediate webhook states and inventory TTL locks |
| PCI DSS v4.0 | **PCI DSS v4.0.1** webhook specifics (raw payload HMAC, constant-time compare, 300s replay window) |

### 2. New 2026 Patterns to Add
- **MPP Payment Flow** section with complete HTTP 402 sequence diagram
- **x402 Protocol Integration** with crypto deposit addresses and CDP facilitator
- **Stripe Dynamic Payment Methods** configuration
- **BNPL Messaging Elements** integration on product/cart pages
- **A2A Pay by Bank** with settlement state machine and inventory TTL
- **Programmatic Agent Checkout** (HTTP 402, MPP, off-session SetupIntents)
- **Stripe 2026 Roadmap Features** (session payments, standalone 3DS, Shared Payment Tokens)
- **Webhook Security Hardening** (queue-first, dual-write guard, replay protection)

### 3. Checklist Additions
- [ ] MPP protocol implemented with HTTP 402 challenge/response flow
- [ ] x402 protocol support with crypto deposit addresses (USDC on Base/Tempo)
- [ ] `automatic_payment_methods: { enabled: true }` configured (no hardcoded payment method types)
- [ ] BNPL messaging elements (stripe-payment-method-messaging) on PDP and cart pages
- [ ] A2A bank settlement webhook states handled (processing/pending/settled) with inventory TTL locks
- [ ] HTTP 402/MPP programmatic checkout path tested for non-interactive agent payments
- [ ] Off-session SetupIntents with `setup_future_usage: "off_session"` for stored method charging
- [ ] Webhook signature verification: HMAC over raw payload, constant-time comparison, 300s replay window
- [ ] Queue-first webhook ingestion: 200 OK within 500ms, async worker offload
- [ ] Dual-write idempotency guard: unique index on (provider, event_id, event_type) + distributed lock
- [ ] Stripe 2026 roadmap features evaluated: session payments, standalone 3DS, Shared Payment Tokens
- [ ] No card numbers, CVV, PAN in logs or API responses (EMVCo Network Tokens preferred)
- [ ] Provider SDK version pinned, credentials in env vars only

### 4. Failure Mode Additions
- **MPP/x402 payment verification bypass**: Agent replays payment credential → Mitigation: Nonce-based verification, facilitator settlement confirmation
- **Crypto payment settlement failure**: On-chain transaction fails but agent received resource → Mitigation: Transaction verification mode, facilitator webhook confirmation before resource release
- **A2A settlement timeout**: Bank transfer stuck in pending → Mitigation: Inventory TTL with background sweeper, configurable max wait time
- **BNPL messaging mismatch**: Incorrect installment amounts displayed → Mitigation: Dynamic price/currency/country passed to element, server-side validation
- **Webhook replay attack**: Attacker resends old webhook → Mitigation: 300s timestamp rejection, idempotency key deduplication
- **Queue-first ingestion backlog**: Webhook handler overwhelmed → Mitigation: Async worker scaling, dead letter queue for failed events

### 5. Output Contract Updates
- Add `contracts/schemas/mpp-payment-spec.json` for MPP endpoints and flow
- Add `contracts/schemas/x402-payment-spec.json` for x402 crypto payment flow
- Add `contracts/schemas/bnpl-messaging-spec.json` for BNPL element integration
- Add `contracts/schemas/a2a-settlement-spec.json` for A2A webhook state machine
- Update `contracts/schemas/api-contract-spec.json` with new 2026 payment flows

---

## Implementation Priority

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Add MPP protocol with HTTP 402 flow specification | High |
| P0 | Add x402 crypto payment integration (USDC on Base/Tempo) | High |
| P0 | Update webhook security to queue-first + dual-write guard | High |
| P0 | Add dynamic payment methods (`automatic_payment_methods: true`) | Medium |
| P1 | Add BNPL messaging elements integration | Medium |
| P1 | Add A2A Pay by Bank with settlement state machine | Medium |
| P1 | Add programmatic agent checkout (off-session SetupIntents) | Medium |
| P1 | Add Stripe 2026 roadmap feature evaluations | Low |
| P2 | Expand failure modes with 2026-specific scenarios | Low |
| P2 | Update output contracts for new payment specs | Low |

---

## Validation Gates
- Run `python3 core/scripts/validate-all.py` from agent-skills root after edits
- Verify INDEX.md regeneration if VERSION bumped
- Check adapter parity with `validate-rules.py` (9 parity groups)
- Test MPP flow with `npx mppx@latest validate`
- Test x402 flow with Stripe `2026-05-27.preview` API version