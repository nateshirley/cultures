use crate::anchor_token_metadata;
use anchor_spl::associated_token;
use {crate::state::*, crate::utils::*, anchor_lang::prelude::*, anchor_spl::token};
#[derive(Accounts)]
#[instruction(smart_collection_bump: u8)]
pub struct CreateSmartCollection<'info> {
    payer: Signer<'info>,
    #[account(mut)]
    culture: Box<Account<'info, Culture>>,
    #[account(
        init,
        seeds = [COLLECTION_SEED, culture.key().as_ref()],
        bump = smart_collection_bump,
        payer = payer,
        space = 90
    )]
    smart_collection: Account<'info, SmartCollection>,
    #[account(
        seeds = [COLLECTION_PATROL_SEED],
        bump = collection_patrol.bump,
    )]
    collection_patrol: Account<'info, Patrol>,
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = collection_patrol,
    )]
    collection_mint: Account<'info, token::Mint>, //must also be signer,
    #[account(
        init,
        payer = payer,
        associated_token::authority = collection_patrol,
        associated_token::mint = collection_mint,
    )]
    collection_token_account: Account<'info, token::TokenAccount>,
    #[account(mut)]
    collection_metadata: UncheckedAccount<'info>, //validated via cpi
    #[account(mut)]
    collection_master_edition: UncheckedAccount<'info>, //validated via cpi
    rent: Sysvar<'info, Rent>,
    token_metadata_program: AccountInfo<'info>, //Program<'info, anchor_token_metadata::TokenMetadata>,
    associated_token_program: Program<'info, associated_token::AssociatedToken>,
    token_program: Program<'info, token::Token>,
    system_program: Program<'info, System>,
}

/*
collection authority is
update authority on the collection metadata
temp mint auth on the collection mint
*/

pub fn handler(
    ctx: Context<CreateSmartCollection>,
    smart_collection_bump: u8,
    max_supply: Option<u64>,
    uri: String,
) -> ProgramResult {
    ctx.accounts.culture.collection = ctx.accounts.smart_collection.key();
    ctx.accounts.smart_collection.culture = ctx.accounts.culture.key();
    ctx.accounts.smart_collection.mint = ctx.accounts.collection_mint.key();
    ctx.accounts.smart_collection.max_supply = max_supply;
    ctx.accounts.smart_collection.bump = smart_collection_bump;

    let seeds = &[
        COLLECTION_PATROL_SEED,
        &[ctx.accounts.collection_patrol.bump],
    ];

    //maybe i could use a diff word. like "guard" or someth idk "patrol"
    //mint collection token to authority pda
    token::mint_to(
        ctx.accounts
            .into_mint_collection_token_to_authority_context()
            .with_signer(&[seeds]),
        1,
    )?;

    //create metadata for the collection
    anchor_token_metadata::create_metadata_v2(
        ctx.accounts
            .into_create_collection_metadata_context()
            .with_signer(&[seeds]),
        ctx.accounts.culture.name.clone(),
        ctx.accounts.culture.symbol.clone(),
        uri,
        Some(vec![spl_token_metadata::state::Creator {
            address: ctx.accounts.collection_patrol.key(),
            share: 100,
            verified: true,
        }]),
        0,
        true,
        true,
        None,
        None,
    )?;

    //create master edition for the collection
    anchor_token_metadata::create_master_edition_v3(
        ctx.accounts
            .into_create_collection_master_edition_context()
            .with_signer(&[seeds]),
        Some(0),
    )?;

    Ok(())
}

impl<'info> CreateSmartCollection<'info> {
    fn into_mint_collection_token_to_authority_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token::MintTo<'info>> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = token::MintTo {
            mint: self.collection_mint.to_account_info(),
            to: self.collection_token_account.to_account_info(),
            authority: self.collection_patrol.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_create_collection_metadata_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::CreateMetadataV2<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::CreateMetadataV2 {
            metadata: self.collection_metadata.to_account_info(),
            mint: self.collection_mint.to_account_info(),
            mint_authority: self.collection_patrol.to_account_info(),
            payer: self.payer.to_account_info(),
            update_authority: self.collection_patrol.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
    fn into_create_collection_master_edition_context(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, anchor_token_metadata::CreateMasterEditionV3<'info>> {
        let cpi_program = self.token_metadata_program.to_account_info();
        let cpi_accounts = anchor_token_metadata::CreateMasterEditionV3 {
            edition: self.collection_master_edition.to_account_info(),
            mint: self.collection_mint.to_account_info(),
            update_authority: self.collection_patrol.to_account_info(),
            mint_authority: self.collection_patrol.to_account_info(),
            payer: self.payer.to_account_info(),
            metadata: self.collection_metadata.to_account_info(),
            token_program: self.token_program.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
            system_program: self.system_program.to_account_info(),
            rent: self.rent.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}
