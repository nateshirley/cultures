use anchor_lang::prelude::*;
//could pass this # in on the client. a bit safer this way tho

pub fn calculate_short_term_rent(data_len: usize, num_days: u64) -> u64 {
    let __anchor_rent = Rent::get().unwrap();
    let exempt_lamports = Rent::get().unwrap().minimum_balance(data_len);
    exempt_lamports
        .checked_mul(num_days)
        .unwrap()
        .checked_div(730)
        .unwrap()
}
