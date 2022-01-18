use {
    crate::state::*,
    crate::utils::*,
    anchor_lang::{prelude::*, solana_program},
};

#[derive(Accounts)]
#[instruction(like_attr_bump: u8)]
pub struct LikePost<'info> {
    culture: Account<'info, Culture>,
    liker: Signer<'info>,
    #[account(
        constraint = liker_membership.culture == culture.key(),
        constraint = liker_membership.member == liker.key(),
    )]
    liker_membership: Account<'info, Membership>,
    #[account(mut,
        seeds = [liker_membership.key().as_ref(), post.key().as_ref()],
        bump = like_attr_bump
    )]
    like_attribution: AccountInfo<'info>,
    #[account(
        mut,
        constraint = post.culture == culture.key()
    )]
    post: Account<'info, Post>,
    #[account(
        mut,
        constraint = poster_membership.culture == culture.key(),
        constraint = poster_membership.member == post.poster
    )]
    poster_membership: Account<'info, Membership>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<LikePost>, like_attr_bump: u8) -> ProgramResult {
    //make like account that stays alive for 10 days
    solana_program::program::invoke_signed(
        &solana_program::system_instruction::create_account(
            &ctx.accounts.liker.key(),
            &ctx.accounts.like_attribution.key(),
            calculate_short_term_rent(1, 10),
            1,
            &ctx.program_id,
        ),
        &[
            ctx.accounts.liker.to_account_info(),
            ctx.accounts.like_attribution.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[&[
            ctx.accounts.liker_membership.key().as_ref(),
            ctx.accounts.post.key().as_ref(),
            &[like_attr_bump],
        ]],
    )?;

    let additional_points = ctx.accounts.liker_membership.audience_stake;
    //give points to the post
    ctx.accounts.post.score = ctx
        .accounts
        .post
        .score
        .checked_add(additional_points)
        .unwrap();
    //increase poster's all time score
    ctx.accounts.poster_membership.all_time_score = ctx
        .accounts
        .poster_membership
        .all_time_score
        .checked_add(additional_points)
        .unwrap();
    Ok(())
}
