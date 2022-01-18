use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Post {
    pub culture: Pubkey,
    pub poster: Pubkey, //wallet addr
    pub body: String,
    pub timestamp: u64,
    pub score: u64,
}
