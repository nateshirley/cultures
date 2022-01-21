use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Culture {
    pub name: String,
    pub symbol: String,
    pub smart_collection: Pubkey,
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
//8 + str + str + (32 * 4) + 4 + 4 + 1
// = 145 + str
//symbol str = 4 setup + 4 chars = 8
//name str = 20 (16chars + 4 setup)
//173
//should i enforce unique symbols or unique names?
//i think symbols might make more sense? idk
