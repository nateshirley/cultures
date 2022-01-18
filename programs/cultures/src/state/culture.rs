use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Culture {
    pub name: String,
    pub collection: Pubkey,
    pub treasury: Pubkey,
    pub creator_mint: Pubkey,
    pub creator_count: u32,
    pub audience_mint: Pubkey,
    pub audience_count: u32,
    pub bump: u8,
}

pub trait Symmetry {
    fn is_symmetrical(&self) -> bool;
}
impl Symmetry for Culture {
    fn is_symmetrical(&self) -> bool {
        self.creator_mint == self.audience_mint
    }
}
//8 + str + (32 * 4) + 4 + 4 + 1
// = 145 + str
//str = 20 (16chars + 4 setup)
