# Flint Escrow Protocol

**Trustless escrow for freelance payments on Solana**

## Overview

This Anchor program implements a trustless escrow system where:
- **Buyer** locks USDC in a PDA vault (neither party can access alone)
- **Seller** delivers work
- **Buyer** releases payment OR deadline triggers auto-refund
- **Either party** can open disputes

## Program ID

- **Devnet:** `FLNT111111111111111111111111111111111111111`
- **Mainnet:** TBD (after deployment)

## Instructions

### 1. `create_escrow`
Initialize escrow account with PDA
- **Signer:** Buyer
- **Creates:** Escrow account + vault ATA

### 2. `fund_escrow`
Transfer USDC from buyer to escrow vault
- **Signer:** Buyer
- **State:** Created → Funded

### 3. `mark_delivered`
Seller marks work as delivered
- **Signer:** Seller (verified)
- **State:** Funded → Delivered

### 4. `release_payment`
Buyer approves and releases funds to seller
- **Signer:** Buyer
- **State:** Delivered → Released
- **Transfers:** Vault → Seller ATA

### 5. `refund_buyer`
Timeout or dispute resolution - refund to buyer
- **Signer:** Buyer (or admin for disputes)
- **State:** Funded/Disputed → Refunded
- **Transfers:** Vault → Buyer ATA

### 6. `open_dispute`
Open dispute (freezes funds until resolved)
- **Signer:** Buyer or Seller
- **State:** Delivered → Disputed

## Escrow States

```
Created → Funded → Delivered → Released (happy path)
                     ↓
                Disputed → Resolved (manual)
                     ↓
                Refunded (timeout)
```

## Development

### Setup

```bash
# Install Anchor
avm install 0.30.1
avm use 0.30.1

# Install dependencies
yarn

# Build program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Testing

```bash
# Run all tests
yarn test

# Run specific test
yarn test tests/escrow.test.ts
```

### Deployment

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet (after audit!)
anchor deploy --provider.cluster mainnet
```

## Security

- ✅ PDA escrow accounts (no human control)
- ✅ Deadline enforcement
- ✅ State machine validation
- ✅ Token transfer via CPI

### Audit Checklist

- [ ] External audit (OtterSec/Neodyme)
- [ ] Bug bounty program
- [ ] Rate limiting
- [ ] Emergency pause mechanism

## License

BUSL-1.1 (Business Source License)

---

**Flint Labs** - Building trustless commerce on Solana
