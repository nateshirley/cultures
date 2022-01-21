import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, MintLayout } from "@solana/spl-token";
import { BN, Program } from "@project-serum/anchor";
import { Cultures } from "../target/types/cultures";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  findAssociatedTokenAccount,
  findMasterEdition,
  findTokenMetadata,
  TOKEN_METADATA_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "./helpers/tokenHelpers";
import { getCulturesProgram } from "./helpers/config";
import {
  CreatorConfig,
  CultureConfig,
  getCreatorConfig,
  getCultureConfig,
  getSmartCollectionConfig,
  makeNewToken,
  Pda,
  SmartCollectionConfig,
  TokenConfig,
} from "./helpers/execution";
import * as addresses from "./helpers/findAddress";
import { hardPayer } from "./helpers/hardPayer";
import { findLikeAttribution } from "./helpers/findAddress";

declare var TextEncoder: any;

describe("cultures", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const anyAnchor: any = anchor;
  const Cultures = getCulturesProgram(provider.wallet);

  //need to do a lot of shit to get this in shape

  let testName = "test11";
  let payer = hardPayer;
  let post = web3.Keypair.generate();

  let makeToken = true;
  let programInit = true;
  let cultureInit = true;
  let createMembershipAcct = false;
  let increaseCreatorStake = false;
  let decreaseCreatorStake = false;
  let increaseAudienceStake = false;
  let decreaseAudienceStake = false;
  let createPost = false;
  let submitLike = false;
  let mintPost = false;

  let creatorToken: TokenConfig;
  let creatorConfig: CreatorConfig;
  let cultureConfig: CultureConfig;
  let collectionConfig: SmartCollectionConfig;

  it("setup", async () => {
    await doAirdrops();
    if (makeToken) {
      creatorToken = await makeNewToken(payer);
    } else {
      let cultureInfo = await Cultures.account.culture.fetch(
        cultureConfig.culture.address
      );
      creatorToken = {
        mint: cultureInfo.creatorMint,
        mintAuthority: payer,
        Token: new Token(
          provider.connection,
          cultureInfo.creatorMint,
          TOKEN_PROGRAM_ID,
          payer
        ),
      };
    }
    cultureConfig = await getCultureConfig(
      testName,
      creatorToken.mint,
      creatorToken.mint
    );
    creatorConfig = await getCreatorConfig(
      cultureConfig.culture,
      creatorToken.mint,
      provider.wallet.publicKey,
      payer
    );
    if (makeToken) {
      await creatorToken.Token.mintTo(
        creatorConfig.tokenAccount.address,
        creatorToken.mintAuthority,
        [],
        10000
      );
    }
    collectionConfig = await getSmartCollectionConfig(cultureConfig.culture);
  });

  if (programInit) {
    it("program init", async () => {
      const tx = await Cultures.rpc.initializeProgram(
        cultureConfig.stakePatrol.bump,
        collectionConfig.collectionPatrol.bump,
        {
          accounts: {
            initializer: provider.wallet.publicKey,
            stakePatrol: cultureConfig.stakePatrol.address,
            collectionPatrol: collectionConfig.collectionPatrol.address,
            systemProgram: SystemProgram.programId,
          },
        }
      );
    });
  }

  if (cultureInit) {
    it("culture init", async () => {
      const tx = await Cultures.rpc.createSmartCollection(
        collectionConfig.smartCollection.bump,
        new BN(212),
        "google.com",
        {
          accounts: {
            payer: provider.wallet.publicKey,
            culture: cultureConfig.culture.address,
            smartCollection: collectionConfig.smartCollection.address,
            collectionPatrol: collectionConfig.collectionPatrol.address,
            collectionMint: collectionConfig.mint,
            collectionTokenAccount: collectionConfig.tokenAccount.address,
            collectionMetadata: collectionConfig.metadata.address,
            collectionMasterEdition: collectionConfig.masterEdition.address,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
          },
          instructions: [
            Cultures.instruction.createCulture(
              cultureConfig.culture.bump,
              testName,
              "TEST",
              {
                accounts: {
                  culture: cultureConfig.culture.address,
                  payer: provider.wallet.publicKey,
                  creatorMint: creatorToken.mint,
                  creatorStakePool: cultureConfig.creatorStakePool.address,
                  creatorRedemptionMint:
                    cultureConfig.creatorRedemptionMint.address,
                  audienceMint: creatorToken.mint,
                  audienceStakePool: cultureConfig.audienceStakePool.address,
                  audienceRedemptionMint:
                    cultureConfig.audienceRedemptionMint.address,
                  stakePatrol: cultureConfig.stakePatrol.address,
                  rent: web3.SYSVAR_RENT_PUBKEY,
                  tokenProgram: TOKEN_PROGRAM_ID,
                  systemProgram: web3.SystemProgram.programId,
                },
              }
            ),
          ],
          signers: [collectionConfig.mintPair],
        }
      );
      console.log("Your transaction signature", tx);
      let newCulture = await Cultures.account.culture.fetch(
        cultureConfig.culture.address
      );
      let collectionBalance = await provider.connection.getTokenAccountBalance(
        collectionConfig.tokenAccount.address
      );
      //console.log(collectionBalance);
    });
  }

  if (createMembershipAcct) {
    it("create membership account", async () => {
      const tx = await Cultures.rpc.createMembership(
        creatorConfig.membership.bump,
        {
          accounts: {
            culture: cultureConfig.culture.address,
            newMember: provider.wallet.publicKey,
            membership: creatorConfig.membership.address,
            systemProgram: SystemProgram.programId,
          },
        }
      );
    });
  }

  if (increaseCreatorStake) {
    it("increase creator stake", async () => {
      const tx = await Cultures.rpc.changeCreatorStake(
        cultureConfig.creatorStakePool.bump,
        new BN(50),
        {
          accounts: {
            culture: cultureConfig.culture.address,
            member: provider.wallet.publicKey,
            membership: creatorConfig.membership.address,
            creatorTokenAccount: creatorConfig.tokenAccount.address,
            creatorStakePool: cultureConfig.creatorStakePool.address,
            stakePatrol: cultureConfig.stakePatrol.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      let creatorAcct = await provider.connection.getTokenAccountBalance(
        creatorConfig.tokenAccount.address
      );
      console.log(creatorAcct);
      let membershipp = await Cultures.account.membership.fetch(
        creatorConfig.membership.address
      );
      printMembership(membershipp);
    });
  }

  if (decreaseCreatorStake) {
    it("decrease creator stake", async () => {
      const tx = await Cultures.rpc.changeCreatorStake(
        cultureConfig.creatorStakePool.bump,
        new BN(-20),
        {
          accounts: {
            culture: cultureConfig.culture.address,
            member: provider.wallet.publicKey,
            membership: creatorConfig.membership.address,
            creatorTokenAccount: creatorConfig.tokenAccount.address,
            creatorStakePool: cultureConfig.creatorStakePool.address,
            stakePatrol: cultureConfig.stakePatrol.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      let creatorAcct = await provider.connection.getTokenAccountBalance(
        creatorConfig.tokenAccount.address
      );
      console.log(creatorAcct);
      let membershipp = await Cultures.account.membership.fetch(
        creatorConfig.membership.address
      );
      printMembership(membershipp);
    });
  }

  if (increaseAudienceStake) {
    it("increase audience stake", async () => {
      const tx = await Cultures.rpc.changeAudienceStake(
        cultureConfig.audienceStakePool.bump,
        new BN(20),
        {
          accounts: {
            culture: cultureConfig.culture.address,
            member: provider.wallet.publicKey,
            membership: creatorConfig.membership.address,
            audienceTokenAccount: creatorConfig.tokenAccount.address,
            audienceStakePool: cultureConfig.audienceStakePool.address,
            stakePatrol: cultureConfig.stakePatrol.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      let creatorAcct = await provider.connection.getTokenAccountBalance(
        creatorConfig.tokenAccount.address
      );
      console.log(creatorAcct);
      let membershipp = await Cultures.account.membership.fetch(
        creatorConfig.membership.address
      );
      printMembership(membershipp);
    });
  }

  if (decreaseAudienceStake) {
    it("decrease audience stake", async () => {
      const tx = await Cultures.rpc.changeAudienceStake(
        cultureConfig.audienceStakePool.bump,
        new BN(-10),
        {
          accounts: {
            culture: cultureConfig.culture.address,
            member: provider.wallet.publicKey,
            membership: creatorConfig.membership.address,
            audienceTokenAccount: creatorConfig.tokenAccount.address,
            audienceStakePool: cultureConfig.audienceStakePool.address,
            stakePatrol: cultureConfig.stakePatrol.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      let creatorAcct = await provider.connection.getTokenAccountBalance(
        creatorConfig.tokenAccount.address
      );
      console.log(creatorAcct);
      let membershipp = await Cultures.account.membership.fetch(
        creatorConfig.membership.address
      );
      printMembership(membershipp);
    });
  }

  if (createPost) {
    it("submit post", async () => {
      let body = "baby's first post 😘";
      let tx = await Cultures.rpc.createPost(calculatePostSize(body), body, {
        accounts: {
          culture: cultureConfig.culture.address,
          poster: provider.wallet.publicKey,
          membership: creatorConfig.membership.address,
          post: post.publicKey,
          clock: web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        },
        signers: [post],
      });

      let postInfo = await Cultures.account.post.fetch(post.publicKey);
      console.log(postInfo);
      calculatePostSize(body);
    });
  }

  if (submitLike) {
    it("submit like", async () => {
      let likeAttr = await findLikeAttribution(
        creatorConfig.membership.address,
        post.publicKey
      );
      const tx = await Cultures.rpc.likePost(likeAttr.bump, {
        accounts: {
          culture: cultureConfig.culture.address,
          liker: provider.wallet.publicKey,
          likerMembership: creatorConfig.membership.address,
          post: post.publicKey,
          posterMembership: creatorConfig.membership.address,
          likeAttribution: likeAttr.address,
          systemProgram: SystemProgram.programId,
        },
      });

      let postInfo = await Cultures.account.post.fetch(post.publicKey);
      console.log("post score,   ", postInfo.score.toNumber());
    });
  }

  if (mintPost) {
    it("mint post", async () => {
      let postInfo = await Cultures.account.post.fetch(post.publicKey);
      let cultureInfo = await Cultures.account.culture.fetch(
        cultureConfig.culture.address
      );
      console.log(cultureInfo);
      let collectionInfo = await Cultures.account.smartCollection.fetch(
        cultureInfo.smartCollection
      );
      let poster = postInfo.poster; //here i don't need to sign bc poster is provider wallet
      let itemMint = web3.Keypair.generate();
      let posterTokenAccount = await findAssociatedTokenAccount(
        poster,
        itemMint.publicKey
      );
      const tx = await Cultures.rpc.mintPost(
        cultureConfig.creatorStakePool.bump,
        cultureConfig.audienceStakePool.bump,
        "google.com",
        {
          accounts: {
            culture: cultureConfig.culture.address,
            smartCollection: collectionConfig.smartCollection.address,
            poster: poster,
            payer: provider.wallet.publicKey,
            post: post.publicKey,
            membership: creatorConfig.membership.address,
            creatorStakePool: cultureConfig.creatorStakePool.address,
            audienceStakePool: cultureConfig.audienceStakePool.address,
            itemMint: itemMint.publicKey,
            itemMetadata: await findTokenMetadata(itemMint.publicKey).then(
              (pda) => {
                return pda.address;
              }
            ),
            itemMasterEdition: await findMasterEdition(itemMint.publicKey).then(
              (pda) => {
                return pda.address;
              }
            ),
            posterTokenAccount: posterTokenAccount.address,
            collectionMint: collectionInfo.mint,
            collectionMetadata: await findTokenMetadata(
              collectionInfo.mint
            ).then((pda) => {
              return pda.address;
            }),
            collectionMasterEdition: await findMasterEdition(
              collectionInfo.mint
            ).then((pda) => {
              return pda.address;
            }),
            collectionPatrol: collectionConfig.collectionPatrol.address,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
          signers: [itemMint],
        }
      );
    });
  }

  const doAirdrops = async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        provider.wallet.publicKey,
        1 * web3.LAMPORTS_PER_SOL
      ),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        payer.publicKey,
        1 * web3.LAMPORTS_PER_SOL
      ),
      "confirmed"
    );
  };

  const calculatePostSize = (body: String) => {
    let defaultSize = Cultures.account.post.size + 3; //4 byte setup on the string
    let encodedLength = new TextEncoder().encode(body).length;
    return defaultSize + encodedLength;
  };

  const printMembership = (membership: any) => {
    let newMembership = {
      culture: membership.culture.toBase58(),
      member: membership.member.toBase58(),
      creatorStake: membership.creatorStake.toNumber(),
      audienceStake: membership.audienceStake.toNumber(),
      allTimeScore: membership.allTimeScore.toNumber(),
    };
    console.log(newMembership);
  };
});
