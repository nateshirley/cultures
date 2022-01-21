use {crate::state::*, crate::utils::*, anchor_lang::prelude::*, anchor_spl::token};

#[derive(Accounts)]
#[instruction(culture_bump: u8, name: String, symbol: String)]
pub struct CreateCulture<'info> {
    #[account(
        init,
        seeds = [CULTURE_SEED, name.clone().to_seed_format().as_bytes()],
        bump = culture_bump,
        payer = payer,
        space = 173, 
    )]
    culture: Account<'info, Culture>,
    payer: Signer<'info>,
    creator_mint: Box<Account<'info, token::Mint>>,
    #[account(
        init,
        seeds = [CREATOR_STAKE_SEED, culture.key().as_ref()],
        bump,
        payer = payer,
        token::mint = creator_mint,
        token::authority = stake_patrol,
    )]
    creator_stake_pool: Box<Account<'info, token::TokenAccount>>,
    #[account(
        init,
        seeds = [CREATOR_REDEMPTION_SEED, culture.key().as_ref()],
        bump,
        payer = payer,
        mint::decimals = creator_mint.decimals,
        mint::authority = stake_patrol,
        mint::freeze_authority = stake_patrol,
    )]
    creator_redemption_mint: Box<Account<'info, token::Mint>>,
    audience_mint: Account<'info, token::Mint>,
    #[account(
        init,
        seeds = [AUDIENCE_STAKE_SEED, culture.key().as_ref()],
        bump,
        payer = payer,
        token::mint = creator_mint,
        token::authority = stake_patrol,
    )]
    audience_stake_pool: Account<'info, token::TokenAccount>,
    #[account(
        init,
        seeds = [AUDIENCE_REDEMPTION_SEED, culture.key().as_ref()],
        bump,
        payer = payer,
        mint::decimals = audience_mint.decimals,
        mint::authority = stake_patrol,
        mint::freeze_authority = stake_patrol,
    )]
    audience_redemption_mint: Account<'info, token::Mint>,
    #[account(
        seeds = [STAKE_PATROL_SEED],
        bump = stake_patrol.bump
    )]
    stake_patrol: Account<'info, Patrol>,
    rent: Sysvar<'info, Rent>,
    token_program: Program<'info, token::Token>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateCulture>, _culture_bump: u8, name: String, symbol: String ) -> ProgramResult {
    ctx.accounts.culture.name = name.to_seed_format();
    ctx.accounts.culture.symbol = symbol; 
    ctx.accounts.culture.creator_mint = ctx.accounts.creator_mint.key();
    ctx.accounts.culture.audience_mint = ctx.accounts.audience_mint.key();
    Ok(())
}
