use std::thread::AccessError;

use {crate::state::*, crate::utils::*, anchor_lang::prelude::*};

#[derive(Accounts)]
#[instruction(stake_authority_bump: u8, collection_authority_bump: u8)]
pub struct InitializeProgram<'info> {
    initializer: Signer<'info>,
    #[account(
        init,
        seeds = [STAKE_AUTHORITY_SEED],
        bump = stake_authority_bump,
        payer = initializer
    )]
    stake_authority: Account<'info, Authority>,
    #[account(
        init,
        seeds = [COLLECTION_AUTHORITY_SEED],
        bump = collection_authority_bump,
        payer = initializer
    )]
    collection_authority: Account<'info, Authority>,
    system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeProgram>,
    stake_authority_bump: u8,
    collection_authority_bump: u8,
) -> ProgramResult {
    ctx.accounts.stake_authority.bump = stake_authority_bump;
    ctx.accounts.collection_authority.bump = collection_authority_bump;
    Ok(())
}
