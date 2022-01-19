use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Patrol {
    pub bump: u8,
}
