use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Authority {
    pub bump: u8,
}
