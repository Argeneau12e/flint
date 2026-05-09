//! Flint Escrow Protocol
//! 
//! A secure escrow program for Flint payment requests.
//! Funds are held in a PDA until conditions are met.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("FLiNT7xKqUvMvJz9pN8xR3qYwZ2hGfDsA1bC4eE5fF6g");

#[program]
pub mod flint_escrow {
    use super::*;

    /// Initialize a new escrow account
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        escrow_id: [u8; 16],
        amount: u64,
        delivery_deadline: i64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.escrow_id = escrow_id;
        escrow.creator = ctx.accounts.creator.key();
        escrow.buyer = Pubkey::default(); // Set on fund
        escrow.mint = ctx.accounts.mint.key();
        escrow.amount = amount;
        escrow.state = EscrowState::Draft;
        escrow.delivery_deadline = delivery_deadline;
        escrow.bump = ctx.bumps.escrow;
        escrow.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Buyer funds the escrow
    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Draft, EscrowError::InvalidState);
        require!(
            Clock::get()?.unix_timestamp <= escrow.delivery_deadline,
            EscrowError::DeadlineExceeded
        );

        // Transfer tokens from buyer to escrow PDA
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_ata.to_account_info(),
            to: ctx.accounts.escrow_ata.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let ctx_cpi = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(ctx_cpi, escrow.amount)?;

        // Update escrow state
        escrow.state = EscrowState::Funded;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.funded_at = Clock::get()?.unix_timestamp;

        emit!(EscrowFunded {
            escrow_id: escrow.escrow_id,
            buyer: ctx.accounts.buyer.key(),
            amount: escrow.amount,
        });

        Ok(())
    }

    /// Seller marks work as delivered
    pub fn deliver(ctx: Context<Deliver>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Funded, EscrowError::InvalidState);
        require!(
            escrow.creator == ctx.accounts.creator.key(),
            EscrowError::Unauthorized
        );

        escrow.state = EscrowState::Delivered;
        escrow.delivered_at = Clock::get()?.unix_timestamp;
        escrow.review_deadline = Clock::get()?.unix_timestamp + (7 * 24 * 60 * 60); // 7 days

        emit!(WorkDelivered {
            escrow_id: escrow.escrow_id,
            delivered_at: escrow.delivered_at,
        });

        Ok(())
    }

    /// Buyer approves and releases funds to seller
    pub fn release(ctx: Context<Release>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Delivered, EscrowError::InvalidState);
        require!(
            escrow.buyer == ctx.accounts.buyer.key(),
            EscrowError::Unauthorized
        );

        // Transfer tokens from escrow PDA to seller
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_ata.to_account_info(),
            to: ctx.accounts.seller_ata.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        
        let seeds = &[
            b"escrow".as_ref(),
            &escrow.escrow_id,
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        let ctx_cpi = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(ctx_cpi, escrow.amount)?;

        escrow.state = EscrowState::Released;
        escrow.released_at = Clock::get()?.unix_timestamp;

        emit!(PaymentReleased {
            escrow_id: escrow.escrow_id,
            seller: escrow.creator,
            amount: escrow.amount,
        });

        Ok(())
    }

    /// Auto-release after review period (called by anyone)
    pub fn auto_release(ctx: Context<AutoRelease>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Delivered, EscrowError::InvalidState);
        require!(
            Clock::get()?.unix_timestamp >= escrow.review_deadline,
            EscrowError::ReviewPeriodNotExpired
        );

        // Transfer tokens from escrow PDA to seller
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_ata.to_account_info(),
            to: ctx.accounts.seller_ata.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        
        let seeds = &[
            b"escrow".as_ref(),
            &escrow.escrow_id,
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        let ctx_cpi = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(ctx_cpi, escrow.amount)?;

        escrow.state = EscrowState::AutoReleased;
        escrow.released_at = Clock::get()?.unix_timestamp;

        emit!(PaymentAutoReleased {
            escrow_id: escrow.escrow_id,
            seller: escrow.creator,
            amount: escrow.amount,
        });

        Ok(())
    }

    /// Refund to buyer (timeout or cancellation)
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.state == EscrowState::Draft || 
            escrow.state == EscrowState::Funded,
            EscrowError::InvalidState
        );
        
        // Check if deadline exceeded
        let clock = Clock::get()?;
        let deadline_exceeded = clock.unix_timestamp > escrow.delivery_deadline;
        require!(
            deadline_exceeded || escrow.state == EscrowState::Draft,
            EscrowError::DeadlineNotExceeded
        );

        // Transfer tokens back to buyer
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_ata.to_account_info(),
            to: ctx.accounts.buyer_ata.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        
        let seeds = &[
            b"escrow".as_ref(),
            &escrow.escrow_id,
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        let ctx_cpi = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(ctx_cpi, escrow.amount)?;

        escrow.state = EscrowState::Refunded;
        escrow.refunded_at = clock.unix_timestamp;

        emit!(PaymentRefunded {
            escrow_id: escrow.escrow_id,
            buyer: escrow.buyer,
            amount: escrow.amount,
        });

        Ok(())
    }

    /// Cancel escrow (creator only, before funding)
    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Draft, EscrowError::InvalidState);
        require!(
            escrow.creator == ctx.accounts.creator.key(),
            EscrowError::Unauthorized
        );

        escrow.state = EscrowState::Cancelled;
        escrow.cancelled_at = Clock::get()?.unix_timestamp;

        emit!(EscrowCancelled {
            escrow_id: escrow.escrow_id,
            creator: escrow.creator,
        });

        Ok(())
    }
}

// Account Structures

#[derive(Accounts)]
#[instruction(escrow_id: [u8; 16])]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + EscrowAccount::SIZE,
        seeds = [b"escrow", &escrow_id],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub mint: Account<'info, token::Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        constraint = buyer_ata.mint == escrow.mint,
        constraint = buyer_ata.owner == buyer.key()
    )]
    pub buyer_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"escrow", &escrow.escrow_id],
        bump = escrow.bump
    )]
    pub escrow_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Deliver<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", &escrow.escrow_id],
        bump = escrow.bump
    )]
    pub escrow_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = seller_ata.mint == escrow.mint
    )]
    pub seller_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AutoRelease<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub escrow_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = seller_ata.mint == escrow.mint
    )]
    pub seller_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub escrow_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = buyer_ata.mint == escrow.mint
    )]
    pub buyer_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut)]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Escrow Account State

#[account]
pub struct EscrowAccount {
    pub escrow_id: [u8; 16],
    pub creator: Pubkey,
    pub buyer: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub state: EscrowState,
    pub delivery_deadline: i64,
    pub review_deadline: i64,
    pub bump: u8,
    pub created_at: i64,
    pub funded_at: i64,
    pub delivered_at: i64,
    pub released_at: i64,
    pub refunded_at: i64,
    pub cancelled_at: i64,
}

impl EscrowAccount {
    pub const SIZE: usize = 
        16 +  // escrow_id
        32 +  // creator
        32 +  // buyer
        32 +  // mint
        8 +   // amount
        1 +   // state
        8 +   // delivery_deadline
        8 +   // review_deadline
        1 +   // bump
        8 +   // created_at
        8 +   // funded_at
        8 +   // delivered_at
        8 +   // released_at
        8 +   // refunded_at
        8;    // cancelled_at
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowState {
    Draft,
    Funded,
    Delivered,
    Released,
    AutoReleased,
    Refunded,
    Cancelled,
}

// Events

#[event]
pub struct EscrowFunded {
    pub escrow_id: [u8; 16],
    pub buyer: Pubkey,
    pub amount: u64,
}

#[event]
pub struct WorkDelivered {
    pub escrow_id: [u8; 16],
    pub delivered_at: i64,
}

#[event]
pub struct PaymentReleased {
    pub escrow_id: [u8; 16],
    pub seller: Pubkey,
    pub amount: u64,
}

#[event]
pub struct PaymentAutoReleased {
    pub escrow_id: [u8; 16],
    pub seller: Pubkey,
    pub amount: u64,
}

#[event]
pub struct PaymentRefunded {
    pub escrow_id: [u8; 16],
    pub buyer: Pubkey,
    pub amount: u64,
}

#[event]
pub struct EscrowCancelled {
    pub escrow_id: [u8; 16],
    pub creator: Pubkey,
}

// Errors

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
    #[msg("Review period not yet expired")]
    ReviewPeriodNotExpired,
    #[msg("Invalid token mint")]
    InvalidMint,
}
