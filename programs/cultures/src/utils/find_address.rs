use crate::id;
use crate::utils::seeds::*;
use anchor_lang::prelude::*;

pub fn find_creator_stake_pool(culture: Pubkey, bump: u8) -> Pubkey {
    Pubkey::create_program_address(
        &[CREATOR_STAKE_SEED, culture.key().as_ref(), &[bump]],
        &id(),
    )
    .unwrap()
}
pub fn find_audience_stake_pool(culture: Pubkey, bump: u8) -> Pubkey {
    Pubkey::create_program_address(
        &[AUDIENCE_STAKE_SEED, culture.key().as_ref(), &[bump]],
        &id(),
    )
    .unwrap()
}
