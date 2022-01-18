use {crate::state::*, crate::utils::*, anchor_lang::prelude::*};

#[derive(Accounts)]
#[instruction(stake_authority_bump: u8)]
pub struct InitializeProgram<'info> {
    initializer: Signer<'info>,
    #[account(
        init,
        seeds = [STAKE_AUTHORITY_SEED],
        bump = stake_authority_bump,
        payer = initializer
    )]
    stake_authority: Account<'info, Authority>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeProgram>, stake_authority_bump: u8) -> ProgramResult {
    ctx.accounts.stake_authority.bump = stake_authority_bump;
    Ok(())
}
