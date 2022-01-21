import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, MintLayout } from "@solana/spl-token";
import { BN, Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  findAssociatedTokenAccount,
  findMasterEdition,
  findTokenMetadata,
  TOKEN_METADATA_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "./tokenHelpers";
import { getCulturesProgram } from "./config";
import * as addresses from "./findAddress";

export interface TokenConfig {
  mint: PublicKey;
  mintAuthority: Keypair;
  Token: Token;
}
export interface CreatorConfig {
  authority: PublicKey;
  mint: PublicKey;
  membership: Pda;
  tokenAccount: Pda;
}
export interface CultureConfig {
  culture: Pda;
  name: string;
  creatorMint: PublicKey;
  audienceMint: PublicKey;
  creatorStakePool: Pda;
  creatorRedemptionMint: Pda;
  audienceStakePool: Pda;
  audienceRedemptionMint: Pda;
  stakePatrol: Pda;
}
export interface Pda {
  address: web3.PublicKey;
  bump: number;
}
export interface SmartCollectionConfig {
  mint: PublicKey;
  mintPair: Keypair;
  smartCollection: Pda;
  collectionPatrol: Pda;
  tokenAccount: Pda;
  metadata: Pda;
  masterEdition: Pda;
}

const provider = anchor.Provider.env();

export const makeNewToken = async (payer: Keypair): Promise<TokenConfig> => {
  let mintPair = Keypair.generate();
  let mintAuthority = payer;
  let transaction = new web3.Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintPair.publicKey,
      space: MintLayout.span,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(
        MintLayout.span
      ),
      programId: TOKEN_PROGRAM_ID,
    }),
    //init subscription mint account
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mintPair.publicKey,
      4,
      mintAuthority.publicKey,
      null
    )
  );
  await web3.sendAndConfirmTransaction(provider.connection, transaction, [
    payer,
    mintPair,
  ]);
  return {
    mint: mintPair.publicKey,
    mintAuthority: mintAuthority,
    Token: new Token(
      provider.connection,
      mintPair.publicKey,
      TOKEN_PROGRAM_ID,
      payer
    ),
  };
};

export const getCreatorConfig = async (
  culture: Pda,
  creatorMint: PublicKey,
  authority: PublicKey,
  payer: Keypair
): Promise<CreatorConfig> => {
  let creatorTokenAccount = await findAssociatedTokenAccount(
    authority,
    creatorMint
  );
  let transaction = new web3.Transaction().add(
    createAssociatedTokenAccountInstruction(
      creatorMint,
      creatorTokenAccount.address,
      authority,
      payer.publicKey
    )
  );
  await web3.sendAndConfirmTransaction(provider.connection, transaction, [
    payer,
  ]);
  return {
    authority: authority,
    mint: creatorMint,
    membership: await addresses.findMembership(culture.address, authority),
    tokenAccount: creatorTokenAccount,
  };
};

export const getCultureConfig = async (
  name: string,
  creatorMint: PublicKey,
  audienceMint: PublicKey
): Promise<CultureConfig> => {
  let culture = await addresses.findCulture(name);
  return {
    culture: culture,
    name: name,
    creatorMint: creatorMint,
    audienceMint: audienceMint,
    creatorStakePool: await addresses.findCreatorStakePool(culture.address),
    creatorRedemptionMint: await addresses.findCreatorRedemptionMint(
      culture.address
    ),
    audienceStakePool: await addresses.findAudienceStakePool(culture.address),
    audienceRedemptionMint: await addresses.findAudienceRedemptionMint(
      culture.address
    ),
    stakePatrol: await addresses.findPatrol("stake_patrol"),
  };
};
export const getSmartCollectionConfig = async (
  culture: Pda
): Promise<SmartCollectionConfig> => {
  let mint = web3.Keypair.generate();
  let collectionPatrol = await addresses.findPatrol("collection_patrol");
  return {
    mint: mint.publicKey,
    mintPair: mint,
    smartCollection: await addresses.findSmartCollection(culture.address),
    collectionPatrol: collectionPatrol,
    tokenAccount: await findAssociatedTokenAccount(
      collectionPatrol.address,
      mint.publicKey
    ),
    metadata: await findTokenMetadata(mint.publicKey),
    masterEdition: await findMasterEdition(mint.publicKey),
  };
};
