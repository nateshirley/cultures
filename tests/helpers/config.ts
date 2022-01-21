import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import {
  Token,
  TOKEN_PROGRAM_ID,
  MintLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN, Program, Provider } from "@project-serum/anchor";
//import { Cultures } from "../target/types/cultures";
import idl from "../../target/idl/cultures.json";

import {
  PublicKey,
  SystemProgram,
  Connection,
  Commitment,
  Keypair,
} from "@solana/web3.js";
import { Cultures } from "../../target/types/cultures";

//cluster = "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"
//cluster = "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"

let localnet = true;

export const getCulturesProgram = (wallet: any): Program<Cultures> => {
  if (localnet) {
    return anchor.workspace.Cultures as Program<Cultures>;
  } else {
    const provider = getProvider(wallet);
    let myIdl: any = idl;
    return new Program(myIdl, CULTURES_PROGRAM_ID, provider);
  }
};

export const getProvider = (withWallet: any) => {
  const commitment: Commitment = "processed";
  let confirmOptions = { preflightCommitment: commitment };
  let wallet: any = withWallet;
  const provider = new Provider(getConnection(), wallet, confirmOptions);
  return provider;
};
export const getConnection = () => {
  const endpoint = ENDPOINT;
  const commitment: Commitment = "processed";
  return new Connection(ENDPOINT, commitment);
};
export const CULTURES_PROGRAM_ID = getCulturesProgram(
  anchor.Provider.env().wallet
).programId;

const endpoint = () => {
  if (localnet) {
    return "http://127.0.0.1:8899";
  } else {
    return "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/";
  }
};
export const ENDPOINT = endpoint();
