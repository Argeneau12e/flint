# Flint Escrow Program - Deployment Guide

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.30.1
avm use 0.30.1

# Install Node dependencies
npm install
```

## Build Program

```bash
cd programs/escrow
anchor build
```

This generates:
- `target/deploy/flint_escrow.so` - Program binary
- `target/idl/flint_escrow.json` - IDL (Interface Description Language)

## Deploy to Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Deploy program
anchor deploy --provider.cluster devnet
```

**Save the program ID** - it will be printed after deployment. Update:
- `src/lib/solana/escrow-program.ts` - `FLINT_ESCROW_PROGRAM_ID`
- `programs/escrow/Anchor.toml` - `[programs.localnet]`

## Deploy to Mainnet

```bash
# Configure for mainnet
solana config set --url mainnet

# Deploy (requires SOL for deployment fees ~2-3 SOL)
anchor deploy --provider.cluster mainnet
```

## Verify Deployment

```bash
# Check program account
solana account <PROGRAM_ID>

# Check deployed programs
solana program show <PROGRAM_ID>
```

## Frontend Integration

After deployment, update these files with the new program ID:

1. `src/lib/solana/escrow-program.ts`
   ```typescript
   export const FLINT_ESCROW_PROGRAM_ID = new PublicKey('YOUR_DEPLOYED_PROGRAM_ID');
   ```

2. Set environment variable:
   ```
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   ESCROW_MODE=production
   ```

## Testing

```bash
# Run tests
anchor test

# Localnet testing
solana-test-validator
anchor localnet
```

## Security Considerations

- [ ] Audit smart contract before mainnet deployment
- [ ] Test all edge cases (timeouts, invalid states, etc.)
- [ ] Set up multi-sig for program upgrades
- [ ] Monitor program logs for suspicious activity
- [ ] Implement rate limiting on frontend

## Program Accounts

| Account | Size | Description |
|---------|------|-------------|
| Escrow PDA | 200 bytes | Holds escrow state and funds |

## Instructions

| Instruction | Discriminator | Description |
|-------------|---------------|-------------|
| `initialize_escrow` | 0 | Create new escrow |
| `fund_escrow` | 1 | Buyer deposits tokens |
| `deliver` | 2 | Seller marks delivered |
| `release` | 3 | Buyer approves release |
| `auto_release` | 4 | Auto-release after timeout |
| `refund` | 5 | Refund to buyer |
| `cancel` | 6 | Cancel before funding |

## Events

The program emits these events for tracking:
- `EscrowFunded`
- `WorkDelivered`
- `PaymentReleased`
- `PaymentAutoReleased`
- `PaymentRefunded`
- `EscrowCancelled`

## Costs

- **Deployment:** ~2-3 SOL (one-time)
- **Initialize Escrow:** ~0.00001 SOL (account creation)
- **Fund/Deliver/Release:** ~0.000005 SOL per transaction
- **Token transfer fees:** Included in transaction

## Support

For issues or questions:
- GitHub Issues
- Discord: [Flint Discord]
- Email: security@flint.pay
