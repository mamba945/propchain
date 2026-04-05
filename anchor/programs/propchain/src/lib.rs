use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("Prop1111111111111111111111111111111111111111");

#[program]
pub mod propchain {
    use super::*;

    /// Creates a new property listing with an SPL token mint for fractional ownership.
    pub fn initialize_property(
        ctx: Context<InitializeProperty>,
        title: String,
        address: String,
        total_tokens: u64,
        price_per_token: u64,
        uri: String,
    ) -> Result<()> {
        require!(total_tokens > 0, PropChainError::InvalidTokenAmount);
        require!(price_per_token > 0, PropChainError::InvalidPrice);
        require!(title.len() <= 64, PropChainError::StringTooLong);
        require!(address.len() <= 128, PropChainError::StringTooLong);
        require!(uri.len() <= 200, PropChainError::StringTooLong);

        let bump = ctx.bumps.property;
        let owner_key = ctx.accounts.owner.key();
        let mint_key = ctx.accounts.mint.key();

        // Mint all tokens to the property's token vault before taking mutable borrow.
        let seeds = &[
            b"property" as &[u8],
            owner_key.as_ref(),
            mint_key.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.property_vault.to_account_info(),
                    authority: ctx.accounts.property.to_account_info(),
                },
                signer_seeds,
            ),
            total_tokens,
        )?;

        // Now take the mutable borrow to set fields.
        let property = &mut ctx.accounts.property;
        property.owner = owner_key;
        property.mint = mint_key;
        property.title = title;
        property.address = address;
        property.total_tokens = total_tokens;
        property.tokens_sold = 0;
        property.price_per_token = price_per_token;
        property.uri = uri;
        property.rent_pool = 0;
        property.rent_distributed = 0;
        property.bump = bump;

        msg!("Property initialized: {} with {} tokens", property.title, total_tokens);
        Ok(())
    }

    /// Buy fractional tokens from a property. Buyer sends SOL to property owner,
    /// receives tokens from the property vault.
    pub fn buy_tokens(ctx: Context<BuyTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, PropChainError::InvalidTokenAmount);

        let property = &ctx.accounts.property;
        let available = property.total_tokens - property.tokens_sold;
        require!(amount <= available, PropChainError::InsufficientTokens);

        // Calculate SOL cost.
        let total_cost = property
            .price_per_token
            .checked_mul(amount)
            .ok_or(PropChainError::Overflow)?;

        // Transfer SOL from buyer to property owner.
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.owner.to_account_info(),
                },
            ),
            total_cost,
        )?;

        // Transfer tokens from property vault to buyer's token account.
        let owner_key = ctx.accounts.owner.key();
        let mint_key = ctx.accounts.mint.key();
        let seeds = &[
            b"property",
            owner_key.as_ref(),
            mint_key.as_ref(),
            &[property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.property_vault.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: ctx.accounts.property.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        // Update sold count.
        let property = &mut ctx.accounts.property;
        property.tokens_sold = property
            .tokens_sold
            .checked_add(amount)
            .ok_or(PropChainError::Overflow)?;

        msg!("Bought {} tokens for {} lamports", amount, total_cost);
        Ok(())
    }

    /// Property owner deposits rent into the pool. Any token holder can then
    /// claim their proportional share via `claim_rent`.
    pub fn deposit_rent(ctx: Context<DepositRent>, amount: u64) -> Result<()> {
        require!(amount > 0, PropChainError::InvalidPrice);

        // Transfer SOL from owner to property PDA (rent pool).
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.owner.to_account_info(),
                    to: ctx.accounts.property.to_account_info(),
                },
            ),
            amount,
        )?;

        let property = &mut ctx.accounts.property;
        property.rent_pool = property
            .rent_pool
            .checked_add(amount)
            .ok_or(PropChainError::Overflow)?;

        msg!("Deposited {} lamports as rent", amount);
        Ok(())
    }

    /// Token holder claims their proportional share of deposited rent.
    /// share = (holder_tokens / total_tokens) * rent_pool
    pub fn claim_rent(ctx: Context<ClaimRent>) -> Result<()> {
        let property = &ctx.accounts.property;
        require!(property.rent_pool > 0, PropChainError::NoRentToClaim);

        let holder_balance = ctx.accounts.claimer_token_account.amount;
        require!(holder_balance > 0, PropChainError::NoTokensHeld);

        // Calculate proportional share: (holder_balance * rent_pool) / total_tokens
        let share = (holder_balance as u128)
            .checked_mul(property.rent_pool as u128)
            .ok_or(PropChainError::Overflow)?
            .checked_div(property.total_tokens as u128)
            .ok_or(PropChainError::Overflow)? as u64;

        require!(share > 0, PropChainError::NoRentToClaim);

        // Transfer SOL from property PDA to claimer.
        let owner_key = property.owner;
        let mint_key = property.mint;
        let bump = property.bump;
        let seeds = &[
            b"property",
            owner_key.as_ref(),
            mint_key.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        **ctx
            .accounts
            .property
            .to_account_info()
            .try_borrow_mut_lamports()? -= share;
        **ctx
            .accounts
            .claimer
            .to_account_info()
            .try_borrow_mut_lamports()? += share;

        // Ensure the PDA signed (for runtime verification, we use seeds).
        let property = &mut ctx.accounts.property;
        property.rent_pool = property
            .rent_pool
            .checked_sub(share)
            .ok_or(PropChainError::Overflow)?;
        property.rent_distributed = property
            .rent_distributed
            .checked_add(share)
            .ok_or(PropChainError::Overflow)?;

        msg!(
            "Claimed {} lamports rent for {} tokens",
            share,
            holder_balance
        );
        Ok(())
    }

    /// Transfer property tokens between wallets (standard SPL transfer with logging).
    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, PropChainError::InvalidTokenAmount);
        require!(
            ctx.accounts.from_token_account.amount >= amount,
            PropChainError::InsufficientTokens
        );

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from_token_account.to_account_info(),
                    to: ctx.accounts.to_token_account.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            ),
            amount,
        )?;

        msg!(
            "Transferred {} property tokens from {} to {}",
            amount,
            ctx.accounts.sender.key(),
            ctx.accounts.to_token_account.key()
        );
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Account structs
// ---------------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct Property {
    pub owner: Pubkey,
    pub mint: Pubkey,
    #[max_len(64)]
    pub title: String,
    #[max_len(128)]
    pub address: String,
    pub total_tokens: u64,
    pub tokens_sold: u64,
    pub price_per_token: u64,
    #[max_len(200)]
    pub uri: String,
    pub rent_pool: u64,
    pub rent_distributed: u64,
    pub bump: u8,
}

// ---------------------------------------------------------------------------
// Instruction contexts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeProperty<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + Property::INIT_SPACE,
        seeds = [b"property", owner.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub property: Account<'info, Property>,

    #[account(
        init,
        payer = owner,
        mint::decimals = 0,
        mint::authority = property,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = property,
    )]
    pub property_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Validated via property constraint — this is the property owner receiving SOL.
    #[account(
        mut,
        constraint = owner.key() == property.owner @ PropChainError::Unauthorized
    )]
    pub owner: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"property", owner.key().as_ref(), mint.key().as_ref()],
        bump = property.bump,
    )]
    pub property: Account<'info, Property>,

    #[account(
        constraint = mint.key() == property.mint @ PropChainError::MintMismatch
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = property,
    )]
    pub property_vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositRent<'info> {
    #[account(
        mut,
        constraint = owner.key() == property.owner @ PropChainError::Unauthorized
    )]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"property", owner.key().as_ref(), property.mint.as_ref()],
        bump = property.bump,
    )]
    pub property: Account<'info, Property>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRent<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"property", property.owner.as_ref(), property.mint.as_ref()],
        bump = property.bump,
    )]
    pub property: Account<'info, Property>,

    #[account(
        associated_token::mint = property.mint,
        associated_token::authority = claimer,
    )]
    pub claimer_token_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = sender,
    )]
    pub from_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = mint,
    )]
    pub to_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum PropChainError {
    #[msg("Invalid token amount")]
    InvalidTokenAmount,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("String exceeds maximum length")]
    StringTooLong,
    #[msg("Not enough tokens available")]
    InsufficientTokens,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Mint mismatch")]
    MintMismatch,
    #[msg("No rent available to claim")]
    NoRentToClaim,
    #[msg("No tokens held")]
    NoTokensHeld,
}
