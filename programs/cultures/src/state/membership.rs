use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Membership {
    pub culture: Pubkey,
    pub member: Pubkey,
    pub creator_stake: u64,
    pub audience_stake: u64,
    pub all_time_score: u64,
    pub bump: u8,
}
