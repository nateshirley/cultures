use std::thread::AccessError;

use {crate::state::*, crate::utils::*, anchor_lang::prelude::*};

#[derive(Accounts)]
#[instruction(stake_patrol_bump: u8, collection_patrol_bump: u8)]
pub struct InitializeProgram<'info> {
    initializer: Signer<'info>,
    #[account(
        init,
        seeds = [STAKE_PATROL_SEED],
        bump = stake_patrol_bump,
        payer = initializer
    )]
    stake_patrol: Account<'info, Patrol>,
    #[account(
        init,
        seeds = [COLLECTION_PATROL_SEED],
        bump = collection_patrol_bump,
        payer = initializer
    )]
    collection_patrol: Account<'info, Patrol>,
    system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeProgram>,
    stake_patrol_bump: u8,
    collection_patrol_bump: u8,
) -> ProgramResult {
    ctx.accounts.stake_patrol.bump = stake_patrol_bump;
    ctx.accounts.collection_patrol.bump = collection_patrol_bump;
    Ok(())
}
