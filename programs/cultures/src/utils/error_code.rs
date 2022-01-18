use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("you are trying to unstake more than you have staked")]
    InsufficientStakeWithdraw,
}
