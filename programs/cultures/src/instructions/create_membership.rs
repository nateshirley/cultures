use {crate::state::*, crate::utils::*, anchor_lang::prelude::*};

#[derive(Accounts)]
#[instruction(membership_bump: u8)]
pub struct CreateMembership<'info> {
    culture: Account<'info, Culture>,
    new_member: Signer<'info>,
    #[account(
        init_if_needed,
        seeds = [MEMBERSHIP_SEED, culture.key().as_ref(), new_member.key().as_ref()],
        bump = membership_bump,
        payer = new_member
    )]
    membership: Account<'info, Membership>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateMembership>, membership_bump: u8) -> ProgramResult {
    //config membership
    ctx.accounts.membership.culture = ctx.accounts.culture.key();
    ctx.accounts.membership.member = ctx.accounts.new_member.key();
    ctx.accounts.membership.bump = membership_bump;
    Ok(())
}
