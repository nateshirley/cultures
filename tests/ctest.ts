import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, MintLayout } from "@solana/spl-token";
import { BN, Program } from "@project-serum/anchor";
import { Cultures } from "../target/types/cultures";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  findAssociatedTokenAccount,
} from "./helpers/tokenHelpers";

declare var TextEncoder: any;

describe("cultures", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const anyAnchor: any = anchor;
  const Cultures = anyAnchor.workspace.Cultures as Program<Cultures>;

  interface Pda {
    address: web3.PublicKey;
    bump: number;
  }
  let MembershipToken: Token;
  let testCulture: Pda;
  let testCollection = web3.Keypair.generate();
  let stakeAuthority: Pda;
  let testName = "test";
  let membershipMint = web3.Keypair.generate();
  let membership: Pda;
  let creatorTokenAccount: Pda;
  let payer = web3.Keypair.generate();
  let creatorStakePool: Pda;
  let creatorRedemptionMint: Pda;
  let audienceStakePool: Pda;
  let audienceRedemptionMint: Pda;
  let post = web3.Keypair.generate();

  let makeToken = true;
  let programInit = true;
  let cultureInit = true;
  let createMembershipAcct = true;
  let increaseCreatorStake = true;
  let decreaseCreatorStake = true;
  let increaseAudienceStake = true;
  let decreaseAudienceStake = true;
  let createPost = true;
  let submitLike = true;
  let mintPost = false;

  it("setup", async () => {
    testCulture = await findCulture(testName);
    stakeAuthority = await findAuthority("stake");
    membership = await findMembership(
      testCulture.address,
      provider.wallet.publicKey
    );
    MembershipToken = new Token(
      provider.connection,
      membershipMint.publicKey,
      TOKEN_PROGRAM_ID,
      payer
    );
    creatorTokenAccount = await findAssociatedTokenAccount(
      provider.wallet.publicKey,
      membershipMint.publicKey
    );
    creatorStakePool = await findCreatorStakePool(testCulture.address);
    creatorRedemptionMint = await findCreatorRedemptionMint(
      testCulture.address
    );
    audienceStakePool = await findAudienceStakePool(testCulture.address);
    audienceRedemptionMint = await findAudienceRedemptionMint(
      testCulture.address
    );
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
          newAccountPubkey: membershipMint.publicKey,
          space: MintLayout.span,
          lamports: await provider.connection.getMinimumBalanceForRentExemption(
            MintLayout.span
          ),
          programId: TOKEN_PROGRAM_ID,
        }),
        //init subscription mint account
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          membershipMint.publicKey,
          4,
          payer.publicKey,
          null
        ),
        createAssociatedTokenAccountInstruction(
          membershipMint.publicKey,
          creatorTokenAccount.address,
          provider.wallet.publicKey,
          payer.publicKey
        )
      );
      await web3.sendAndConfirmTransaction(provider.connection, transaction, [
        payer,
        membershipMint,
      ]);

      await MembershipToken.mintTo(
        creatorTokenAccount.address,
        payer,
        [],
        10000
      );
      //if i want the balances to match i need to match the mint decimals with the token created

      let acctInfo = await MembershipToken.getAccountInfo(
        creatorTokenAccount.address
      );
      console.log(acctInfo);
      let fetched = await provider.connection.getTokenAccountBalance(
        creatorTokenAccount.address
      );
      console.log(fetched);
    });
  }

  if (programInit) {
    it("program init", async () => {
      const tx = await Cultures.rpc.initializeProgram(stakeAuthority.bump, {
        accounts: {
          initializer: provider.wallet.publicKey,
          stakeAuthority: stakeAuthority.address,
          systemProgram: SystemProgram.programId,
        },
      });
    });
  }

  if (cultureInit) {
    it("culture init", async () => {
      // Add your test here.

      const tx = await Cultures.rpc.createCulture(testCulture.bump, testName, {
        accounts: {
          culture: testCulture.address,
          payer: provider.wallet.publicKey,
          collection: testCollection.publicKey,
          creatorMint: membershipMint.publicKey,
          creatorStakePool: creatorStakePool.address,
          creatorRedemptionMint: creatorRedemptionMint.address,
          audienceMint: membershipMint.publicKey,
          audienceStakePool: audienceStakePool.address,
          audienceRedemptionMint: audienceRedemptionMint.address,
          stakeAuthority: stakeAuthority.address,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        },
      });
      console.log("Your transaction signature", tx);
      let newCulture = await Cultures.account.culture.fetch(
        testCulture.address
      );
      //console.log(newCulture);
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
        membership.bump,
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
        membership.bump,
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
        membership.bump,
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
        membership.bump,
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
      let cult = await Cultures.account.culture.fetch(testCulture.address);
      console.log(cult);
      const tx = await Cultures.rpc.mintPost(
        creatorStakePool.bump,
        audienceStakePool.bump,
        {
          accounts: {
            culture: testCulture.address,
            poster: provider.wallet.publicKey,
            post: post.publicKey,
            membership: membership.address,
            creatorStakePool: creatorStakePool.address,
            audienceStakePool: audienceStakePool.address,
          },
        }
      );
    });
  }

  const calculatePostSize = (body: String) => {
    let defaultSize = Cultures.account.post.size + 3; //4 byte setup on the string
    let encodedLength = new TextEncoder().encode(body).length;
    return defaultSize + encodedLength;
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
