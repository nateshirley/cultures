import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN, Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_METADATA_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "./tokenHelpers";
import { getCulturesProgram } from "./envConfig";
import * as addresses from "./findAddress";
import {
  ParticipantConfig,
  CultureConfig,
  getNewCultureConfig,
  getNewSmartCollectionConfig,
  Pda,
} from "./programConfig";
declare var TextEncoder: any;

const provider = anchor.Provider.env();
const Cultures = getCulturesProgram(provider.wallet);

export const newCultureWithCollection = async (
  payer: PublicKey,
  creatorMint: PublicKey,
  audienceMint: PublicKey,
  name: string,
  symbol: string,
  collectionUri: string,
  maxSupply?: BN
) => {
  let cultureConfig = await getNewCultureConfig(
    name,
    creatorMint,
    audienceMint
  );
  let smartCollectionConfig = await getNewSmartCollectionConfig(
    cultureConfig.culture
  );
  //so i put these in separate ixns because i hit the ix max
  await Cultures.rpc.createCulture(
    cultureConfig.culture.bump,
    cultureConfig.stakePatrol.bump,
    name,
    symbol,
    {
      accounts: {
        culture: cultureConfig.culture.address,
        payer: payer,
        creatorMint: creatorMint,
        creatorStakePool: cultureConfig.creatorStakePool.address,
        creatorRedemptionMint: cultureConfig.creatorRedemptionMint.address,
        audienceMint: audienceMint,
        audienceStakePool: cultureConfig.audienceStakePool.address,
        audienceRedemptionMint: cultureConfig.audienceRedemptionMint.address,
        stakePatrol: cultureConfig.stakePatrol.address,
        rent: web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      },
    }
  );
  await Cultures.rpc.createSmartCollection(
    smartCollectionConfig.smartCollection.bump,
    smartCollectionConfig.collectionPatrol.bump,
    maxSupply ?? null,
    collectionUri,
    {
      accounts: {
        payer: payer,
        culture: cultureConfig.culture.address,
        smartCollection: smartCollectionConfig.smartCollection.address,
        collectionPatrol: smartCollectionConfig.collectionPatrol.address,
        collectionMint: smartCollectionConfig.mint,
        collectionTokenAccount: smartCollectionConfig.tokenAccount.address,
        collectionMetadata: smartCollectionConfig.metadata.address,
        collectionMasterEdition: smartCollectionConfig.masterEdition.address,
        rent: web3.SYSVAR_RENT_PUBKEY,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      },
      signers: [smartCollectionConfig.mintPair],
    }
  );
  return {
    culture: cultureConfig.culture,
    smartCollection: smartCollectionConfig.smartCollection,
  };
};
export const createMembership = async (
  creatorConfig: ParticipantConfig,
  culture: Pda
) => {
  await Cultures.rpc.createMembership(creatorConfig.membership.bump, {
    accounts: {
      culture: culture.address,
      newMember: creatorConfig.authority,
      membership: creatorConfig.membership.address,
      systemProgram: SystemProgram.programId,
    },
  });
};

export const changeCreatorStake = async (
  creatorConfig: ParticipantConfig,
  cultureConfig: CultureConfig,
  amount: number
) => {
  await Cultures.rpc.changeCreatorStake(
    cultureConfig.creatorStakePool.bump,
    new BN(amount),
    {
      accounts: {
        culture: cultureConfig.culture.address,
        member: creatorConfig.authority,
        membership: creatorConfig.membership.address,
        creatorTokenAccount: creatorConfig.tokenAccount.address,
        creatorStakePool: cultureConfig.creatorStakePool.address,
        stakePatrol: cultureConfig.stakePatrol.address,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      },
    }
  );
};
export const changeAudienceStake = async (
  audienceMemberConfig: ParticipantConfig,
  cultureConfig: CultureConfig,
  amount: number
) => {
  await Cultures.rpc.changeAudienceStake(
    cultureConfig.audienceStakePool.bump,
    new BN(amount),
    {
      accounts: {
        culture: cultureConfig.culture.address,
        member: audienceMemberConfig.authority,
        membership: audienceMemberConfig.membership.address,
        audienceTokenAccount: audienceMemberConfig.tokenAccount.address,
        audienceStakePool: cultureConfig.audienceStakePool.address,
        stakePatrol: cultureConfig.stakePatrol.address,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      },
    }
  );
};

export const createPost = async (
  culture: Pda,
  creatorConfig: ParticipantConfig,
  post: Pda,
  body: string
) => {
  await Cultures.rpc.createPost(calculatePostSize(body), body, {
    accounts: {
      culture: culture.address,
      poster: creatorConfig.authority,
      membership: creatorConfig.membership.address,
      post: post.address,
      clock: web3.SYSVAR_CLOCK_PUBKEY,
      systemProgram: SystemProgram.programId,
    },
  });
  return post.address;
};
const calculatePostSize = (body: String) => {
  let defaultSize = Cultures.account.post.size + 3; //4 byte setup on the string
  let encodedLength = new TextEncoder().encode(body).length;
  return defaultSize + encodedLength;
};
export const likePost = async (
  culture: Pda,
  post: Pda,
  posterMembership: PublicKey,
  audienceMemberConfig: ParticipantConfig
) => {
  let likeAttr = await addresses.findLikeAttribution(
    audienceMemberConfig.membership.address,
    post.address
  );
  const tx = await Cultures.rpc.likePost(likeAttr.bump, {
    accounts: {
      culture: culture.address,
      liker: audienceMemberConfig.authority,
      likerMembership: audienceMemberConfig.membership.address,
      post: post.address,
      posterMembership: posterMembership,
      likeAttribution: likeAttr.address,
      systemProgram: SystemProgram.programId,
    },
  });
};
