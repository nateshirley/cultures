use anchor_lang::prelude::*;
use anchor_spl_token_metadata::anchor_token_metadata;
declare_id!("GF36TdsrypzPojynRP4E7UsbQQUrcR2GRnR64oScGZY7");
mod instructions;
pub mod state;
pub mod utils;

/*
some stuff to do

- add symbol to the culture itself, rather than the collection
- no im doing it with names
=

*/

use instructions::*;
#[program]
pub mod cultures {
    use super::*;

    pub fn initialize_program(
        ctx: Context<InitializeProgram>,
        stake_patrol_bump: u8,
        collection_patrol_bump: u8,
    ) -> ProgramResult {
        initialize_program::handler(ctx, stake_patrol_bump, collection_patrol_bump)
    }

    pub fn create_culture(
        ctx: Context<CreateCulture>,
        culture_bump: u8,
        name: String,
        symbol: String,
    ) -> ProgramResult {
        create_culture::handler(ctx, culture_bump, name, symbol)
    }

    pub fn create_smart_collection(
        ctx: Context<CreateSmartCollection>,
        smart_collection_bump: u8,
        max_supply: Option<u64>,
        uri: String,
    ) -> ProgramResult {
        create_smart_collection::handler(ctx, smart_collection_bump, max_supply, uri)
    }

    pub fn create_membership(ctx: Context<CreateMembership>, membership_bump: u8) -> ProgramResult {
        create_membership::handler(ctx, membership_bump)
    }

    //if you have a symmetrical culture, use creator stake for changing both posting & voting
    pub fn change_creator_stake(
        ctx: Context<ChangeCreatorStake>,
        creator_stake_pool_bump: u8,
        amount: i64,
    ) -> ProgramResult {
        change_creator_stake::handler(ctx, creator_stake_pool_bump, amount)
    }

    pub fn change_audience_stake(
        ctx: Context<ChangeAudienceStake>,
        audience_stake_pool_bump: u8,
        amount: i64,
    ) -> ProgramResult {
        change_audience_stake::handler(ctx, audience_stake_pool_bump, amount)
    }

    pub fn create_post(ctx: Context<CreatePost>, space: u32, body: String) -> ProgramResult {
        create_post::handler(ctx, space, body)
    }

    pub fn like_post(ctx: Context<LikePost>, like_attr_bump: u8) -> ProgramResult {
        like_post::handler(ctx, like_attr_bump)
    }

    pub fn mint_post(
        ctx: Context<MintPost>,
        _creator_stake_pool_bump: u8,
        _audience_stake_pool_bump: u8,
        item_uri: String,
    ) -> ProgramResult {
        mint_post::handler(ctx, item_uri)
    }
    //ok so u have a choice of whether to standardize this mint function or
    //so im going to put it all in here
}

/*
choice between standardizing the mint function in the cultures program or letting it pass in a mint
some stuff to think about
- either way you're gonna want the minting to be in one transaction for ux
- so there's not really much of a benefit to not doing it for that reason
- other question is... how to standardize/make sure the mints are 1:1 and amtch with the right posts in the way that i want them to
- benefit of more freeform option is that i can be more flexible with how it's built
- i already have the custom one ready to go
- this is sort of the roadblock that i hit on monday, bc i was like, i don't want to standardize minting for everyone else
but i did
if i wanted to standardize the mints,
the problem is that anyone could pass in anything on the client for the actual metadata
so if you had a post that got votes, u could just pass in metadata for like, boobs
which i guess will always be the case tho, bc i cant build all the metadata custom, so it is stil up to the person not to fuck it up

lets just say im going to let u pass in from the client, how would i do that
mint key for the post should be a pda with seeds
ok but here i'm already fucked bc i would need the pda to sign so i would have to do the tx in the program
bc i can't make a mint w/ seeds outside
so u can't stash the mint anywhere bc u need the keypair to sign
other thing you could do is create an attribution verified

so if u have a post with score > 100, u can pass that post to the program, with a keypair, and the program will
create an attribution for the mintkeypair at w/ the post pubkey

1. pass post with new mintkey (randomly generated from client) to create NFT attribution in the program
    - this would be like... pda from [postkey] == mint key
2. build the nft on the client
3. pass the nft back into the program, along with other shit u need, in order to verify the nft as part of the collection
//possibly u would have to do shit like,,,transfer the authority to a program authority
it's just generally more code and i don't really see what the point of it is

ok so i could do it but i don't really want to
*/

//8 + 32 + 32 + 8 + 9 + 1
/*
so the main difference bw this and what i was going to do is that
im creating all the nfts and metadata for the culture right here in my code
and then instead of authenticating the collection through a proxy, im just going to do it right here
word

very little room for business models to capture value bc there is such an incentive to bootstrap new token valuations

and if u have a separation between your business model and your
it seems unlikely to me that you're going to be able to force users to use your protocol just bc u have a good ui
seems more likely the exact opposite, where prtocols build protocols, and then the protocol subsidizes the ui
or other people come in and build uis and are agnostic to protocols. idk

for example someone could do something like--- u can burn all your moonbase creator tokens 1:1 for tokens backed by a sol curve
- this would crash the price of everyth lol

sol locked in your curves is unforkable state tho
so if u keep the sol


some shit i need to do
- how to delete old posts
- minting
- collection factory


ok so i don't know how to tie the collection with the thing
so i guess one thing right off the bat, is when u start a culture, u need to also start a collection for that culture
and then you would also have a smart collection that could say...do the collection
so you will probably have to tie the collection to the culture

and at the same time make it derivable

so maybe i should just design them as separate txns for clarity
i'm not sure about the culture

and then work back
bc the only thing i would use the smart collection for is authenticating it

so the new smart collection would be u just pass it a collection and it verifies and checks if u can mint another and verify
im just not really sure i can/should try to design it for other uses bc i don't know the case is really
there and it will be easier to keep everyth in here
*/

/*
why do u even need the posts on chain?

main reason is u need to keep track of whose votes are staked into what posts
if u don't do it on-chain, u can't really verify whose tokens are on what posts
still relatively low risk actually, bc the posts are just getting minted for free, no value locked really
*/
