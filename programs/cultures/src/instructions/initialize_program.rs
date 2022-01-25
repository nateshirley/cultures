use {crate::state::*, crate::utils::*, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
    initializer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(_ctx: Context<InitializeProgram>) -> ProgramResult {
    Ok(())
}
