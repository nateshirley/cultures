use crate::anchor_token_metadata;
use {
    crate::state::*,
    crate::utils::*,
    anchor_lang::prelude::*,
    anchor_spl::{associated_token, token},
};
/*
some stuff to do

- add symbol to the culture itself, rather than the collection
-


extra shit i need here

other option is to separate this into
verify post and then mint post
could be helpful but might start hitting ix count limit
*/
#[derive(Accounts)]
#[instruction(creator_stake_pool_bump: u8, audience_stake_pool_bump: u8)]
pub struct MintPost<'info> {
    culture: Box<Account<'info, Culture>>,
    #[account(
        mut,
        constraint = smart_collection.mint == collection_mint.key(),
        constraint = smart_collection.has_remaining_supply()
    )]
    smart_collection: Box<Account<'info, SmartCollection>>,
    payer: Signer<'info>,
    poster: Signer<'info>,
    #[account(
        constraint = post.culture == culture.key(),
        constraint = post.poster == poster.key(),
    )]
    post: Box<Account<'info, Post>>,
    #[account(
        constraint = membership.culture == culture.key(),
        constraint = membership.member == poster.key()
    )]
    membership: Box<Account<'info, Membership>>,
    #[account(
        mut,
        address = find_creator_stake_pool(culture.key(), creator_stake_pool_bump)
    )]
    creator_stake_pool: Account<'info, token::TokenAccount>,
    #[account(
        mut,
        address = find_audience_stake_pool(culture.key(), audience_stake_pool_bump)
    )]
    audience_stake_pool: Account<'info, token::TokenAccount>,
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = collection_authority,
    )]
    item_mint: Box<Account<'info, token::Mint>>, //must also be signer,
    #[account(mut)]
    item_metadata: UncheckedAccount<'info>, //checked via cpi,
    #[account(mut)]
    item_master_edition: UncheckedAccount<'info>, //checked via cpi
    #[account(
        init,
        payer = payer,
        associated_token::authority = poster,
        associated_token::mint = item_mint,
    )]
    poster_token_account: Box<Account<'info, token::TokenAccount>>,
    collection_mint: UncheckedAccount<'info>, //mint checked via cpi,
    collection_metadata: UncheckedAccount<'info>,
    collection_master_edition: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [COLLECTION_AUTHORITY_SEED],
        bump = collection_authority.bump
    )]
    collection_authority: Account<'info, Authority>,
    rent: Sysvar<'info, Rent>,
    token_metadata_program: AccountInfo<'info>, //Program<'info, anchor_token_metadata::TokenMetadata>,
    associated_token_program: Program<'info, associated_token::AssociatedToken>,
    token_program: Program<'info, token::Token>,
    system_program: Program<'info, System>,
}

/*
to make an NFT, u need
- mint
- a token account for the mint
- metadata
- master edition
*/

pub fn verify_post_eligibility(accounts: &MintPost) -> ProgramResult {
    let audience_count: u32 = accounts.culture.audience_count;
    let tokens_staked: u64 = if accounts.culture.is_symmetrical() {
        accounts.creator_stake_pool.amount
    } else {
        accounts.audience_stake_pool.amount
    };
    if accounts.post.score > minimum_score_to_mint(audience_count, tokens_staked) {
        Ok(())
    } else {
        Err(ErrorCode::PostScoreTooLow.into())
    }
}

pub fn handler(ctx: Context<MintPost>, item_uri: String) -> ProgramResult {
    verify_post_eligibility(&ctx.accounts)?;

    let seeds = &[
        COLLECTION_AUTHORITY_SEED,
        &[ctx.accounts.collection_authority.bump],
    ];
    token::mint_to(
        ctx.accounts
            .into_mint_item_to_receiver_context()
            .with_signer(&[seeds]),
        1,
    )?;

    let metaplex_creator = spl_token_metadata::state::Creator {
        address: ctx.accounts.collection_authority.key(),
        verified: true,
        share: 100,
    };
    let collection = anchor_spl_token_metadata::state::Collection {
        verified: false,
        key: ctx.accounts.smart_collection.mint,
    };
    anchor_token_metadata::create_metadata_v2(
        ctx.accounts
            .into_create_item_metadata_context()
            .with_signer(&[&seeds[..]]),
        ctx.accounts.culture.name.clone(),
        String::from("TEST"),
        item_uri,
        Some(vec![metaplex_creator]),
        0,
        true,
        true,
        Some(collection),
        None,
    )?;

    //create master edition
    anchor_token_metadata::create_master_edition_v3(
        ctx.accounts
            .into_create_item_master_edition_context()
            .with_signer(&[seeds]),
        Some(0),
    )?;

    //verify item's place in the collection
    anchor_token_metadata::verify_collection(
        ctx.accounts
            .into_verify_collection_context()
            .with_signer(&[seeds]),
    )?;

    //update collection supply
    ctx.accounts.smart_collection.supply =
        ctx.accounts.smart_collection.supply.checked_add(1).unwrap();

    Ok(())
}

impl<'info> MintPost<'info> {
    fn into_mint_item_to_receiver_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::MintTo<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::MintTo {
            mint: self.item_mint.to_account_info(),
            to: self.poster_token_account.to_account_info(),
            authority: self.collection_authority.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_create_item_metadata_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::CreateMetadataV2<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::CreateMetadataV2 {
            metadata: self.item_metadata.to_account_info(),
            mint: self.item_mint.to_account_info(),
            mint_authority: self.collection_authority.to_account_info(),
            payer: self.payer.to_account_info(),
            update_authority: self.collection_authority.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_create_item_master_edition_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::CreateMasterEditionV3<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::CreateMasterEditionV3 {
            edition: self.item_master_edition.to_account_info(),
            mint: self.item_mint.to_account_info(),
            update_authority: self.collection_authority.to_account_info(),
            mint_authority: self.collection_authority.to_account_info(),
            payer: self.payer.to_account_info(),
            metadata: self.item_metadata.to_account_info(),
            token_program: self.token_program.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_verify_collection_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::VerifyCollection<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::VerifyCollection {
            item_metadata: self.item_metadata.to_account_info(),
            collection_update_authority: self.collection_authority.to_account_info(),
            payer: self.payer.to_account_info(),
            collection_mint: self.collection_mint.to_account_info(),
            collection_metadata: self.collection_metadata.to_account_info(),
            collection_master_edition: self.collection_master_edition.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}
