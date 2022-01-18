use anchor_lang::prelude::*;

declare_id!("GF36TdsrypzPojynRP4E7UsbQQUrcR2GRnR64oScGZY7");
mod instructions;
pub mod state;
pub mod utils;

use anchor_spl::token;
use instructions::*;
use state::*;
use utils::*;
#[program]
pub mod cultures {
    use super::*;

    pub fn initialize_program(
        ctx: Context<InitializeProgram>,
        stake_authority_bump: u8,
    ) -> ProgramResult {
        initialize_program::handler(ctx, stake_authority_bump)
    }

    pub fn create_culture(
        ctx: Context<CreateCulture>,
        culture_bump: u8,
        name: String,
    ) -> ProgramResult {
        create_culture::handler(ctx, culture_bump, name)
    }

    //now in here do all the shit i was doing yesterday
    pub fn create_smart_collection(
        ctx: Context<CreateSmartCollection>,
        smart_collection_bump: u8,
        max_supply: Option<u64>,
    ) -> ProgramResult {
        ctx.accounts.smart_collection.culture = ctx.accounts.culture.key();
        ctx.accounts.smart_collection.mint = ctx.accounts.collection_mint.key();
        ctx.accounts.smart_collection.max_supply = max_supply;
        ctx.accounts.smart_collection.bump = smart_collection_bump;
        Ok(())
    }

    pub fn create_membership(ctx: Context<CreateMembership>, membership_bump: u8) -> ProgramResult {
        create_membership::handler(ctx, membership_bump)
    }

    //if you have a symmetrical culture, use creator stake for changing both posting & voting
    pub fn change_creator_stake(
        ctx: Context<ChangeCreatorStake>,
        membership_bump: u8,
        creator_stake_pool_bump: u8,
        amount: i64,
    ) -> ProgramResult {
        change_creator_stake::handler(ctx, membership_bump, creator_stake_pool_bump, amount)
    }

    pub fn change_audience_stake(
        ctx: Context<ChangeAudienceStake>,
        membership_bump: u8,
        audience_stake_pool_bump: u8,
        amount: i64,
    ) -> ProgramResult {
        change_audience_stake::handler(ctx, membership_bump, audience_stake_pool_bump, amount)
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
    ) -> ProgramResult {
        mint_post::handler(ctx)
    }
}

//

#[derive(Accounts)]
#[instruction(smart_collection_bump: u8)]
pub struct CreateSmartCollection<'info> {
    payer: Signer<'info>,
    culture: Account<'info, Culture>,
    #[account(
        init,
        seeds = [COLLECTION_SEED, culture.key().as_ref()],
        bump = smart_collection_bump,
        payer = payer
    )]
    smart_collection: Account<'info, SmartCollection>,
    collection_mint: Account<'info, token::Mint>,
    collection_metadata: AccountInfo<'info>,
    collection_master_edition: AccountInfo<'info>,
    system_program: Program<'info, System>, //and then im also going to need to do the metadata and shit here from my other program
}
// //authority is collection authority
// //so collection authority needs to be the update authority on the collection metadata that we create
#[account]
#[derive(Default)]
pub struct SmartCollection {
    pub culture: Pubkey,
    pub mint: Pubkey,
    pub supply: u64,
    pub max_supply: Option<u64>,
    pub bump: u8,
}

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
