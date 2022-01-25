use std::convert::TryFrom;
use {crate::state::*, crate::utils::*, anchor_lang::prelude::*};

#[derive(Accounts)]
#[instruction(space: u32)]
pub struct CreatePost<'info> {
    culture: Account<'info, Culture>,
    poster: Signer<'info>,
    #[account(
        mut,
        constraint = membership.culture == culture.key(),
        constraint = membership.member == poster.key(),
    )]
    membership: Account<'info, Membership>,
    #[account(
        init,
        seeds = [POST_SEED, membership.key().as_ref(), &membership.post_count.to_le_bytes()],
        bump,
        space = usize::try_from(space).unwrap(),
        payer = poster
    )]
    post: Account<'info, Post>,
    clock: Sysvar<'info, Clock>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreatePost>, _space: u32, body: String) -> ProgramResult {
    ctx.accounts.membership.post_count = ctx.accounts.membership.post_count.checked_add(1).unwrap();
    ctx.accounts.post.culture = ctx.accounts.culture.key();
    ctx.accounts.post.membership = ctx.accounts.membership.key();
    ctx.accounts.post.body = body;
    ctx.accounts.post.timestamp = u64::try_from(ctx.accounts.clock.unix_timestamp).unwrap();
    Ok(())
}
