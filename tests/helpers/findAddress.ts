import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { getCulturesProgram } from "./envConfig";
import * as anchor from "@project-serum/anchor";

const CulturesProgram = getCulturesProgram(anchor.Provider.env().wallet);

export const findSmartCollection = (culture: PublicKey) => {
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("collection"), culture.toBuffer()],
    CulturesProgram.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};

export const findLikeAttribution = async (
  membership: PublicKey,
  post: PublicKey
) => {
  return PublicKey.findProgramAddress(
    [membership.toBuffer(), post.toBuffer()],
    CulturesProgram.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
export const findCulture = async (name: String) => {
  return PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode("culture"),
      anchor.utils.bytes.utf8.encode(name.toLowerCase()),
    ],
    CulturesProgram.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
export const findPatrol = async (seed: string, key: PublicKey) => {
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(seed), key.toBuffer()],
    CulturesProgram.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
export const findMembership = async (
  culture: PublicKey,
  authority: PublicKey
) => {
  return PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode("membership"),
      culture.toBuffer(),
      authority.toBuffer(),
    ],
    CulturesProgram.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
export const findCreatorStakePool = async (culture: PublicKey) => {
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("c_stake"), culture.toBuffer()],
    CulturesProgram.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
export const findCreatorRedemptionMint = async (culture: PublicKey) => {
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("c_redemption"), culture.toBuffer()],
    CulturesProgram.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
export const findAudienceStakePool = async (culture: PublicKey) => {
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("a_stake"), culture.toBuffer()],
    CulturesProgram.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
export const findAudienceRedemptionMint = async (culture: PublicKey) => {
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("a_redemption"), culture.toBuffer()],
    CulturesProgram.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
export const findPost = async (membership: PublicKey, postCount: number) => {
  let toArrayLike = new Int32Array([postCount]).buffer;
  let countArray = new Uint8Array(toArrayLike);
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("post"), membership.toBuffer(), countArray],
    CulturesProgram.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
