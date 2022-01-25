use anchor_lang::prelude::*;

//seeds: ["post", membership, post_count]
#[account]
#[derive(Default)]
pub struct Post {
    pub culture: Pubkey,
    pub membership: Pubkey,
    pub body: String,
    pub timestamp: u64,
    pub score: u64,
}

/*

pub poster: Pubkey, //wallet addr. i think im gonna change to membership? so u can get all posts for a specific memberhsip, and get all memberships

if i want to make it totally coherent, i should mark the posts at a specific spot

im also def going to make the posts stored based on the membership
and u don't need two memberships if u are poster/voter right? correct

k so i have some design descrepancy here bc i'm using the wallet address for posts, but the membership for like attr and such
*/
