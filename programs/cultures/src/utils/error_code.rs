use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("you are trying to unstake more than you have staked")]
    InsufficientStakeWithdraw,
    #[msg("this post does not have enough likes to be minted")]
    PostScoreTooLow,
}
