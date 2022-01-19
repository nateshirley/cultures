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

declare var TextEncoder: any;

describe("cultures", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const anyAnchor: any = anchor;
  const Cultures = getCulturesProgram(provider.wallet);

  interface Pda {
    address: web3.PublicKey;
    bump: number;
  }
  let MembershipToken: Token;
  let testCulture: Pda;
  let smartCollection: Pda;
  let collectionMint = web3.Keypair.generate();
  let collectionAuthority: Pda;
  let stakeAuthority: Pda;
  let testName = "test9";
  let newMintKeypair = web3.Keypair.generate();
  let membershipMint: PublicKey;
  let membership: Pda;
  let creatorTokenAccount: Pda;
  let payer = web3.Keypair.generate();
  let creatorStakePool: Pda;
  let creatorRedemptionMint: Pda;
  let audienceStakePool: Pda;
  let audienceRedemptionMint: Pda;
  let post = web3.Keypair.generate();

  let makeToken = true;
  let programInit = false;
  let cultureInit = true;
  let createMembershipAcct = true;
  let increaseCreatorStake = true;
  let decreaseCreatorStake = true;
  let increaseAudienceStake = false;
  let decreaseAudienceStake = false;
  let createPost = true;
  let submitLike = true;
  let mintPost = true;

  it("setup", async () => {
    testCulture = await findCulture(testName);
    stakeAuthority = await findAuthority("stake");
    membership = await findMembership(
      testCulture.address,
      provider.wallet.publicKey
    );
    if (cultureInit) {
      membershipMint = newMintKeypair.publicKey;
    } else {
      let cultureInfo = await Cultures.account.culture.fetch(
        testCulture.address
      );
      membershipMint = cultureInfo.creatorMint;
    }
    MembershipToken = new Token(
      provider.connection,
      membershipMint,
      TOKEN_PROGRAM_ID,
      payer
    );
    creatorTokenAccount = await findAssociatedTokenAccount(
      provider.wallet.publicKey,
      membershipMint
    );
    creatorStakePool = await findCreatorStakePool(testCulture.address);
    creatorRedemptionMint = await findCreatorRedemptionMint(
      testCulture.address
    );
    audienceStakePool = await findAudienceStakePool(testCulture.address);
    audienceRedemptionMint = await findAudienceRedemptionMint(
      testCulture.address
    );
    smartCollection = await findSmartCollection(testCulture.address);
    collectionAuthority = await findCollectionAuthority();
  });

  if (makeToken) {
    it("make a token", async () => {
      //create subscription mint account
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(
          payer.publicKey,
          1 * web3.LAMPORTS_PER_SOL
        ),
        "confirmed"
      );
      let transaction = new web3.Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: payer.publicKey,
          newAccountPubkey: newMintKeypair.publicKey,
          space: MintLayout.span,
          lamports: await provider.connection.getMinimumBalanceForRentExemption(
            MintLayout.span
          ),
          programId: TOKEN_PROGRAM_ID,
        }),
        //init subscription mint account
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          newMintKeypair.publicKey,
          4,
          payer.publicKey,
          null
        ),
        createAssociatedTokenAccountInstruction(
          newMintKeypair.publicKey,
          creatorTokenAccount.address,
          provider.wallet.publicKey,
          payer.publicKey
        )
      );
      await web3.sendAndConfirmTransaction(provider.connection, transaction, [
        payer,
        newMintKeypair,
      ]);

      await MembershipToken.mintTo(
        creatorTokenAccount.address,
        payer,
        [],
        10000
      );

      // let acctInfo = await MembershipToken.getAccountInfo(
      //   creatorTokenAccount.address
      // );
      // console.log(acctInfo);
      // let fetched = await provider.connection.getTokenAccountBalance(
      //   creatorTokenAccount.address
      // );
      // console.log(fetched);
    });
  }

  if (programInit) {
    it("program init", async () => {
      const tx = await Cultures.rpc.initializeProgram(
        stakeAuthority.bump,
        collectionAuthority.bump,
        {
          accounts: {
            initializer: provider.wallet.publicKey,
            stakeAuthority: stakeAuthority.address,
            collectionAuthority: collectionAuthority.address,
            systemProgram: SystemProgram.programId,
          },
        }
      );
    });
  }

  if (cultureInit) {
    it("culture init", async () => {
      let collectionTokenAccount = await findAssociatedTokenAccount(
        collectionAuthority.address,
        collectionMint.publicKey
      );
      let collectionMetadata = await findTokenMetadata(
        collectionMint.publicKey
      );
      let collectionMasterEdition = await findMasterEdition(
        collectionMint.publicKey
      );
      const tx = await Cultures.rpc.createSmartCollection(
        smartCollection.bump,
        new BN(212),
        "google.com",
        {
          accounts: {
            payer: provider.wallet.publicKey,
            culture: testCulture.address,
            smartCollection: smartCollection.address,
            collectionAuthority: collectionAuthority.address,
            collectionMint: collectionMint.publicKey,
            collectionTokenAccount: collectionTokenAccount.address,
            collectionMetadata: collectionMetadata.address,
            collectionMasterEdition: collectionMasterEdition.address,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
          },
          instructions: [
            Cultures.instruction.createCulture(
              testCulture.bump,
              testName,
              "TEST",
              {
                accounts: {
                  culture: testCulture.address,
                  payer: provider.wallet.publicKey,
                  creatorMint: membershipMint,
                  creatorStakePool: creatorStakePool.address,
                  creatorRedemptionMint: creatorRedemptionMint.address,
                  audienceMint: membershipMint,
                  audienceStakePool: audienceStakePool.address,
                  audienceRedemptionMint: audienceRedemptionMint.address,
                  stakeAuthority: stakeAuthority.address,
                  rent: web3.SYSVAR_RENT_PUBKEY,
                  tokenProgram: TOKEN_PROGRAM_ID,
                  systemProgram: web3.SystemProgram.programId,
                },
              }
            ),
          ],
          signers: [collectionMint],
        }
      );
      console.log("Your transaction signature", tx);
      let newCulture = await Cultures.account.culture.fetch(
        testCulture.address
      );
      let collectionBalance = await provider.connection.getTokenAccountBalance(
        collectionTokenAccount.address
      );
      //console.log(collectionBalance);
    });
  }

  if (createMembershipAcct) {
    it("create membership account", async () => {
      const tx = await Cultures.rpc.createMembership(membership.bump, {
        accounts: {
          culture: testCulture.address,
          newMember: provider.wallet.publicKey,
          membership: membership.address,
          systemProgram: SystemProgram.programId,
        },
      });
    });
  }

  if (increaseCreatorStake) {
    it("increase creator stake", async () => {
      const tx = await Cultures.rpc.changeCreatorStake(
        creatorStakePool.bump,
        new BN(50),
        {
          accounts: {
            culture: testCulture.address,
            member: provider.wallet.publicKey,
            membership: membership.address,
            creatorTokenAccount: creatorTokenAccount.address,
            creatorStakePool: creatorStakePool.address,
            stakeAuthority: stakeAuthority.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      let creatorAcct = await provider.connection.getTokenAccountBalance(
        creatorTokenAccount.address
      );
      console.log(creatorAcct);
      let membershipp = await Cultures.account.membership.fetch(
        membership.address
      );
      printMembership(membershipp);
    });
  }

  if (decreaseCreatorStake) {
    it("decrease creator stake", async () => {
      const tx = await Cultures.rpc.changeCreatorStake(
        creatorStakePool.bump,
        new BN(-20),
        {
          accounts: {
            culture: testCulture.address,
            member: provider.wallet.publicKey,
            membership: membership.address,
            creatorTokenAccount: creatorTokenAccount.address,
            creatorStakePool: creatorStakePool.address,
            stakeAuthority: stakeAuthority.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      let creatorAcct = await provider.connection.getTokenAccountBalance(
        creatorTokenAccount.address
      );
      console.log(creatorAcct);
      let membershipp = await Cultures.account.membership.fetch(
        membership.address
      );
      printMembership(membershipp);
    });
  }

  if (increaseAudienceStake) {
    it("increase audience stake", async () => {
      const tx = await Cultures.rpc.changeAudienceStake(
        audienceStakePool.bump,
        new BN(20),
        {
          accounts: {
            culture: testCulture.address,
            member: provider.wallet.publicKey,
            membership: membership.address,
            audienceTokenAccount: creatorTokenAccount.address,
            audienceStakePool: audienceStakePool.address,
            stakeAuthority: stakeAuthority.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      let creatorAcct = await provider.connection.getTokenAccountBalance(
        creatorTokenAccount.address
      );
      console.log(creatorAcct);
      let membershipp = await Cultures.account.membership.fetch(
        membership.address
      );
      printMembership(membershipp);
    });
  }

  if (decreaseAudienceStake) {
    it("decrease audience stake", async () => {
      const tx = await Cultures.rpc.changeAudienceStake(
        audienceStakePool.bump,
        new BN(-10),
        {
          accounts: {
            culture: testCulture.address,
            member: provider.wallet.publicKey,
            membership: membership.address,
            audienceTokenAccount: creatorTokenAccount.address,
            audienceStakePool: audienceStakePool.address,
            stakeAuthority: stakeAuthority.address,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      let creatorAcct = await provider.connection.getTokenAccountBalance(
        creatorTokenAccount.address
      );
      console.log(creatorAcct);
      let membershipp = await Cultures.account.membership.fetch(
        membership.address
      );
      printMembership(membershipp);
    });
  }

  if (createPost) {
    it("submit post", async () => {
      let body = "baby's first post 😘";
      let tx = await Cultures.rpc.createPost(calculatePostSize(body), body, {
        accounts: {
          culture: testCulture.address,
          poster: provider.wallet.publicKey,
          membership: membership.address,
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
        membership.address,
        post.publicKey
      );
      const tx = await Cultures.rpc.likePost(likeAttr.bump, {
        accounts: {
          culture: testCulture.address,
          liker: provider.wallet.publicKey,
          likerMembership: membership.address,
          post: post.publicKey,
          posterMembership: membership.address,
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
        testCulture.address
      );
      console.log(cultureInfo);
      let collectionInfo = await Cultures.account.smartCollection.fetch(
        cultureInfo.collection
      );
      let poster = postInfo.poster; //here i don't need to sign bc poster is provider wallet
      let itemMint = web3.Keypair.generate();
      let posterTokenAccount = await findAssociatedTokenAccount(
        poster,
        itemMint.publicKey
      );
      const tx = await Cultures.rpc.mintPost(
        creatorStakePool.bump,
        audienceStakePool.bump,
        "google.com",
        {
          accounts: {
            culture: testCulture.address,
            smartCollection: smartCollection.address,
            poster: poster,
            payer: provider.wallet.publicKey,
            post: post.publicKey,
            membership: membership.address,
            creatorStakePool: creatorStakePool.address,
            audienceStakePool: audienceStakePool.address,
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
            collectionAuthority: collectionAuthority.address,
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

  const calculatePostSize = (body: String) => {
    let defaultSize = Cultures.account.post.size + 3; //4 byte setup on the string
    let encodedLength = new TextEncoder().encode(body).length;
    return defaultSize + encodedLength;
  };

  const findCollectionAuthority = () => {
    return PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("collection_auth")],
      Cultures.programId
    ).then(([address, bump]) => {
      return {
        address: address,
        bump: bump,
      };
    });
  };

  const findSmartCollection = (culture: PublicKey) => {
    return PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("collection"), culture.toBuffer()],
      Cultures.programId
    ).then(([address, bump]) => {
      return {
        address: address,
        bump: bump,
      };
    });
  };

  const findLikeAttribution = async (
    membership: PublicKey,
    post: PublicKey
  ) => {
    return PublicKey.findProgramAddress(
      [membership.toBuffer(), post.toBuffer()],
      Cultures.programId
    ).then(([address, bump]) => {
      return {
        address: address,
        bump: bump,
      };
    });
  };
  const findCulture = async (name: String) => {
    return PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("culture"),
        anchor.utils.bytes.utf8.encode(name.toLowerCase()),
      ],
      Cultures.programId
    ).then(([address, bump]) => {
      return {
        address: address,
        bump: bump,
      };
    });
  };
  const findAuthority = async (seed: string) => {
    return PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode(seed)],
      Cultures.programId
    ).then(([address, bump]) => {
      return {
        address: address,
        bump: bump,
      };
    });
  };
  const findMembership = async (culture: PublicKey, authority: PublicKey) => {
    return PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("membership"),
        culture.toBuffer(),
        authority.toBuffer(),
      ],
      Cultures.programId
    ).then(([address, bump]) => {
      return {
        address: address,
        bump: bump,
      };
    });
  };
  const findCreatorStakePool = async (culture: PublicKey) => {
    return PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("c_stake"), culture.toBuffer()],
      Cultures.programId
    ).then(([address, bump]) => {
      return {
        address: address,
        bump: bump,
      };
    });
  };
  const findCreatorRedemptionMint = async (culture: PublicKey) => {
    return PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("c_redemption"), culture.toBuffer()],
      Cultures.programId
    ).then(([address, bump]) => {
      return {
        address: address,
        bump: bump,
      };
    });
  };
  const findAudienceStakePool = async (culture: PublicKey) => {
    return PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("a_stake"), culture.toBuffer()],
      Cultures.programId
    ).then(([address, bump]) => {
      return {
        address: address,
        bump: bump,
      };
    });
  };
  const findAudienceRedemptionMint = async (culture: PublicKey) => {
    return PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("a_redemption"), culture.toBuffer()],
      Cultures.programId
    ).then(([address, bump]) => {
      return {
        address: address,
        bump: bump,
      };
    });
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
