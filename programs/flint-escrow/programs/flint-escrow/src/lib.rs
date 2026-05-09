use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("FLNT111111111111111111111111111111111111111");

#[program]
pub mod flint_escrow {
    use super::*;

    /// Initialize escrow account
    /// Buyer locks funds in PDA vault
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        escrow_id: String,
        amount: u64,
        seller: Pubkey,
        deadline: i64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.escrow_id = escrow_id;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = seller;
        escrow.amount = amount;
        escrow.deadline = deadline;
        escrow.state = EscrowState::Created;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.bump = ctx.bumps.escrow;
        Ok(())
    }

    /// Fund escrow with USDC
    /// Buyer transfers tokens to escrow vault
    pub fn fund_escrow(ctx: Context<FundEscrow>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Created, EscrowError::InvalidState);
        
        // Transfer USDC from buyer to escrow vault
        let transfer_accounts = Transfer {
            from: ctx.accounts.buyer_ata.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        
        token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_accounts), amount)?;
        
        escrow.state = EscrowState::Funded;
        escrow.funded_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Mark work as delivered
    /// Seller submits delivery
    pub fn mark_delivered(ctx: Context<MarkDelivered>, delivery_hash: String) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Funded, EscrowError::InvalidState);
        require!(escrow.seller == ctx.accounts.seller.key(), EscrowError::Unauthorized);
        require!(Clock::get()?.unix_timestamp <= escrow.deadline, EscrowError::DeadlineExceeded);
        
        escrow.state = EscrowState::Delivered;
        escrow.delivered_at = Clock::get()?.unix_timestamp;
        escrow.delivery_hash = delivery_hash;
        Ok(())
    }

    /// Release payment to seller
    /// Buyer approves and releases funds
    pub fn release_payment(ctx: Context<ReleasePayment>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Delivered, EscrowError::InvalidState);
        require!(escrow.buyer == ctx.accounts.buyer.key(), EscrowError::Unauthorized);
        
        // Transfer USDC from escrow vault to seller
        let escrow_seeds = &[
            b"escrow".as_ref(),
            escrow.escrow_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&escrow_seeds[..]];
        
        let transfer_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.seller_ata.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_accounts,
                signer_seeds,
            ),
            escrow.amount,
        )?;
        
        escrow.state = EscrowState::Released;
        escrow.released_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Refund buyer (timeout or dispute)
    pub fn refund_buyer(ctx: Context<RefundBuyer>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.state == EscrowState::Funded || escrow.state == EscrowState::Disputed,
            EscrowError::InvalidState
        );
        
        // Check if deadline exceeded
        let clock = Clock::get()?;
        require!(clock.unix_timestamp > escrow.deadline, EscrowError::DeadlineNotExceeded);
        
        // Refund from escrow vault to buyer
        let escrow_seeds = &[
            b"escrow".as_ref(),
            escrow.escrow_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&escrow_seeds[..]];
        
        let transfer_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.buyer_ata.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_accounts,
                signer_seeds,
            ),
            escrow.amount,
        )?;
        
        escrow.state = EscrowState::Refunded;
        escrow.refunded_at = clock.unix_timestamp;
        Ok(())
    }

    /// Open dispute
    pub fn open_dispute(ctx: Context<OpenDispute>, reason: String) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.state == EscrowState::Delivered,
            EscrowError::InvalidState
        );
        
        escrow.state = EscrowState::Disputed;
        escrow.dispute_reason = reason;
        escrow.disputed_at = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

// Account structures
#[derive(Accounts)]
#[instruction(escrow_id: String)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = buyer,
        space = 8 + Escrow::SIZE,
        seeds = [b"escrow", escrow_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub buyer_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"vault", escrow.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MarkDelivered<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    /// CHECK: Seller account
    pub seller: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ReleasePayment<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Seller account
    pub seller: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"vault", escrow.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundBuyer<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault", escrow.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct OpenDispute<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    pub authority: Signer<'info>, // Buyer or seller
}

// Escrow account state
#[account]
pub struct Escrow {
    pub escrow_id: String,      // 32 bytes max
    pub buyer: Pubkey,          // 32 bytes
    pub seller: Pubkey,         // 32 bytes
    pub amount: u64,            // 8 bytes
    pub deadline: i64,          // 8 bytes
    pub state: EscrowState,     // 1 byte
    pub created_at: i64,        // 8 bytes
    pub funded_at: Option<i64>, // 9 bytes (1 byte discriminator + 8 bytes)
    pub delivered_at: Option<i64>,
    pub released_at: Option<i64>,
    pub refunded_at: Option<i64>,
    pub disputed_at: Option<i64>,
    pub delivery_hash: String,  // 64 bytes max
    pub dispute_reason: String, // 256 bytes max
    pub bump: u8,               // 1 byte
}

impl Escrow {
    pub const SIZE: usize = 
        4 + 32 +    // escrow_id (string with length prefix)
        32 +        // buyer
        32 +        // seller
        8 +         // amount
        8 +         // deadline
        1 +         // state
        8 +         // created_at
        9 +         // funded_at (option)
        9 +         // delivered_at (option)
        9 +         // released_at (option)
        9 +         // refunded_at (option)
        9 +         // disputed_at (option)
        4 + 64 +    // delivery_hash
        4 + 256 +   // dispute_reason
        1;          // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowState {
    Created,
    Funded,
    Delivered,
    Released,
    Refunded,
    Disputed,
}

#[error_code]
pub enum EscrowError {
    #[msg("Invalid escrow state for this operation")]
    InvalidState,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Deadline exceeded")]
    DeadlineExceeded,
    #[msg("Deadline not yet exceeded")]
    DeadlineNotExceeded,
}
