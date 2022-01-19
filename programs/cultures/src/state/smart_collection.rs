use anchor_lang::prelude::*;
//authority is collection authority
//so collection authority needs to be the update authority on the collection metadata that we create
#[account]
#[derive(Default)]
pub struct SmartCollection {
    pub culture: Pubkey,
    pub mint: Pubkey,
    pub supply: u64,
    pub max_supply: Option<u64>,
    pub bump: u8,
}
pub trait SupplyConstraints {
    fn has_remaining_supply(&self) -> bool;
}
impl SupplyConstraints for SmartCollection {
    fn has_remaining_supply(&self) -> bool {
        if let Some(max_supply) = self.max_supply {
            self.supply < max_supply
        } else {
            true
        }
    }
}
