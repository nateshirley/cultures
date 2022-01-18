//could store an enum in the culture corresponding to different curves
//this will work for now
pub fn minimum_score_to_mint(audience_count: u32, audience_tokens_staked: u64) -> u64 {
    //u want more people to like at lower audience counts and fewer people to like at higher audience counts
    //stake % expressed as a % of total audience token stake required to mint
    //two decimal places
    // y = 5,000,000/(x+1000) + 2000
    //range from 70 to 20 percent approval

    let five_million: u32 = 5000000;
    let mut stake_percentage = five_million
        .checked_div(audience_count.checked_add(1000).unwrap())
        .unwrap();
    stake_percentage = stake_percentage.checked_add(2000).unwrap();
    let minimum_score = audience_tokens_staked
        .checked_mul(stake_percentage.into())
        .unwrap()
        .checked_div(10000)
        .unwrap();
    minimum_score
}
