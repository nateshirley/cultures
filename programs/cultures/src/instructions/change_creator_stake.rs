use std::convert::TryFrom;
use {crate::state::*, crate::utils::*, anchor_lang::prelude::*, anchor_spl::token};

#[derive(Accounts)]
#[instruction(creator_stake_pool_bump: u8)]
pub struct ChangeCreatorStake<'info> {
    #[account(mut)]
    culture: Account<'info, Culture>,
    member: Signer<'info>,
    #[account(
        mut,
        seeds = [MEMBERSHIP_SEED, culture.key().as_ref(), member.key().as_ref()],
        bump = membership.bump,
        constraint = membership.member == member.key()
    )]
    membership: Account<'info, Membership>,
    #[account(
        mut,
        constraint = creator_token_account.owner == member.key(),
        constraint = creator_token_account.mint == culture.creator_mint,
    )]
    creator_token_account: Account<'info, token::TokenAccount>,
    #[account(
        mut,
        address = find_creator_stake_pool(culture.key(), creator_stake_pool_bump)
    )]
    creator_stake_pool: Account<'info, token::TokenAccount>,
    #[account(
        seeds = [STAKE_PATROL_SEED, culture.key().as_ref()],
        bump = stake_patrol.bump,
    )]
    stake_patrol: Account<'info, Patrol>,
    token_program: Program<'info, token::Token>,
    system_program: Program<'info, System>,
}
pub fn handler(
    ctx: Context<ChangeCreatorStake>,
    _creator_stake_pool_bump: u8,
    amount: i64,
) -> ProgramResult {
    //transfer to/from the stake pool
    let unsigned_amount = u64::try_from(amount.checked_abs().unwrap()).unwrap();
    let previous_creator_stake = ctx.accounts.membership.creator_stake;
    let new_creator_stake: u64;
    if amount > 0 {
        stake_creator_tokens(&ctx, unsigned_amount)?;
        new_creator_stake = previous_creator_stake.checked_add(unsigned_amount).unwrap();
        if previous_creator_stake == 0 {
            ctx.accounts.culture.creator_count =
                ctx.accounts.culture.creator_count.checked_add(1).unwrap();
        }
    } else if unsigned_amount <= ctx.accounts.membership.creator_stake {
        withdraw_creator_tokens(&ctx, unsigned_amount)?;
        new_creator_stake = previous_creator_stake.checked_sub(unsigned_amount).unwrap();
        if new_creator_stake == 0 {
            ctx.accounts.culture.creator_count =
                ctx.accounts.culture.creator_count.checked_sub(1).unwrap();
        }
    } else {
        return Err(ErrorCode::InsufficientStakeWithdraw.into());
    }
    //reflect changes in membership account
    ctx.accounts.membership.creator_stake = new_creator_stake;
    //if it's a symmetrical culture (all audience are creators) edit audience counts as well
    if ctx.accounts.culture.is_symmetrical() {
        ctx.accounts.membership.audience_stake = ctx.accounts.membership.creator_stake;
        ctx.accounts.culture.audience_count = ctx.accounts.culture.creator_count;
    }
    Ok(())
}

fn stake_creator_tokens(ctx: &Context<ChangeCreatorStake>, amount: u64) -> ProgramResult {
    anchor_spl::token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.creator_token_account.to_account_info(),
                to: ctx.accounts.creator_stake_pool.to_account_info(),
                authority: ctx.accounts.member.to_account_info(),
            },
        ),
        amount,
    )
}
fn withdraw_creator_tokens(ctx: &Context<ChangeCreatorStake>, amount: u64) -> ProgramResult {
    anchor_spl::token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.creator_stake_pool.to_account_info(),
                to: ctx.accounts.creator_token_account.to_account_info(),
                authority: ctx.accounts.stake_patrol.to_account_info(),
            },
        )
        .with_signer(&[&[
            STAKE_PATROL_SEED,
            ctx.accounts.culture.key().as_ref(),
            &[ctx.accounts.stake_patrol.bump],
        ]]),
        amount,
    )
}
