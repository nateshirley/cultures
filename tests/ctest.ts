import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, MintLayout } from "@solana/spl-token";
import { BN, Program } from "@project-serum/anchor";
import { getCulturesProgram } from "./helpers/envConfig";
import {
  newCultureWithCollection,
  createMembership,
  changeCreatorStake,
  changeAudienceStake,
  createPost,
  likePost,
  mintPost,
} from "./helpers/execution";
import * as addresses from "./helpers/findAddress";
import { hardPayer } from "./helpers/hardPayer";
import { findLikeAttribution } from "./helpers/findAddress";
import {
  configureParticipant,
  CultureConfig,
  deriveSmartCollection,
  getCultureConfig,
  makeNewToken,
  ParticipantConfig,
  Pda,
  TokenConfig,
} from "./helpers/programConfig";
import { Collection } from "./helpers/metadata/accounts";
import { findAssociatedTokenAccount } from "./helpers/tokenHelpers";
import { Cultures } from "../target/types/cultures";

describe("cultures", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const Cultures = getCulturesProgram(provider.wallet);

  //need to do a lot of shit to get this in shape
  //ok so i don't think i ran the devnet tests since i refactored
  //no i did it on localnet

  let testName = "test40";
  let payer = hardPayer;

  let makeToken = true;
  let shouldCreateCulture = true;
  let createMembershipAcct = true;
  let shouldChangeStakes = true;
  let shouldCreateAndLikePost = true;
  let shouldMintPost = true;

  let creatorToken: TokenConfig;
  let creatorConfig: ParticipantConfig;
  let audienceMemberConfig: ParticipantConfig;
  let testCulture: Pda;

  it("setup", async () => {
    let cultureLocation = await addresses.findCulture(testName);
    testCulture = cultureLocation;
    //await doAirdrops();

    if (makeToken) {
      creatorToken = await makeNewToken(payer);
    } else {
      let cultureInfo = await Cultures.account.culture.fetch(
        cultureLocation.address
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
    creatorConfig = await configureParticipant(
      cultureLocation,
      creatorToken.mint,
      provider.wallet.publicKey,
      payer,
      makeToken
    );
    audienceMemberConfig = creatorConfig;
    if (makeToken) {
      await creatorToken.Token.mintTo(
        creatorConfig.tokenAccount.address,
        creatorToken.mintAuthority,
        [],
        10000
      );
    }
  });

  if (shouldCreateCulture) {
    it("culture init", async () => {
      let cultureResponse = await newCultureWithCollection(
        provider.wallet.publicKey,
        creatorToken.mint,
        creatorToken.mint,
        testName,
        "TEST",
        "google.com"
      );
      console.log(cultureResponse);
      // let justCreated = await Cultures.account.culture.fetch(
      //   cultureResponse.culture.address
      // );
      // let collectionBalance = await provider.connection.getTokenAccountBalance(
      //   collectionConfig.tokenAccount.address
      // );
    });
  }

  if (createMembershipAcct) {
    it("create membership account", async () => {
      const tx = await createMembership(creatorConfig, testCulture);
    });
  }

  if (shouldChangeStakes) {
    it("change creator stake", async () => {
      let cultureConfig = await getCultureConfig(testName);
      await changeCreatorStake(creatorConfig, cultureConfig, 500);
      let creatorAcct = await provider.connection.getTokenAccountBalance(
        creatorConfig.tokenAccount.address
      );
      console.log(creatorAcct.value.uiAmount);
      await changeCreatorStake(creatorConfig, cultureConfig, -200);
      let creatorAcctDecreased =
        await provider.connection.getTokenAccountBalance(
          creatorConfig.tokenAccount.address
        );
      console.log(creatorAcctDecreased.value.uiAmount);

      await changeAudienceStake(audienceMemberConfig, cultureConfig, 100);
      await changeAudienceStake(audienceMemberConfig, cultureConfig, -50);
      let membershipp = await Cultures.account.membership.fetch(
        creatorConfig.membership.address
      );
      printMembership(membershipp);
    });
  }

  if (shouldCreateAndLikePost) {
    it("submit post", async () => {
      let postCount = await Cultures.account.membership
        .fetch(creatorConfig.membership.address)
        .then((info) => {
          return info.postCount;
        });
      let post = await addresses.findPost(
        creatorConfig.membership.address,
        postCount + 1
      );

      let body = "baby's first post 😘";
      await createPost(testCulture, creatorConfig, post, body);
      let postInfo = await Cultures.account.post.fetch(post.address);

      console.log(postInfo);
      await likePost(
        testCulture,
        post,
        postInfo.membership,
        audienceMemberConfig
      );
      let postInfoAfterLike = await Cultures.account.post.fetch(post.address);
      console.log("post score,   ", postInfoAfterLike.score.toNumber());
    });
  }

  if (shouldMintPost) {
    it("mint post", async () => {
      let cultureConfig = await getCultureConfig(testName);

      let postCount = await Cultures.account.membership
        .fetch(creatorConfig.membership.address)
        .then((info) => {
          return info.postCount;
        });
      let post = await addresses.findPost(
        creatorConfig.membership.address,
        postCount
      );
      console.log(post);
      let smartCollection = await deriveSmartCollection(
        cultureConfig.culture.address
      );

      await mintPost(
        cultureConfig,
        creatorConfig,
        smartCollection,
        post,
        provider.wallet.publicKey,
        provider.wallet.publicKey
      );
    });
  }

  /*
   */

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

// if (programInit) {
//   it("program init", async () => {
//     await Cultures.rpc.initializeProgram({
//       accounts: {
//         initializer: provider.wallet.publicKey,
//         systemProgram: SystemProgram.programId,
//       },
//     });
//   });
// }
