import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { BN, Program, Provider } from "@project-serum/anchor";
import idl from "../../target/idl/cultures.json";

import { Connection, Commitment } from "@solana/web3.js";
import { Cultures } from "../../target/types/cultures";

//cluster = "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"
//cluster = "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"

let localnet = false;
const endpoint = () => {
  if (localnet) {
    return "http://127.0.0.1:8899";
  } else {
    return "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/";
  }
};
export const getConnection = () => {
  const commitment: Commitment = "processed";
  return new Connection(endpoint(), commitment);
};
export const getProvider = (withWallet: any) => {
  const commitment: Commitment = "processed";
  let confirmOptions = { preflightCommitment: commitment };
  let wallet: any = withWallet;
  const provider = new Provider(getConnection(), wallet, confirmOptions);
  return provider;
};
export const getCulturesProgram = (wallet: any): Program<Cultures> => {
  if (localnet) {
    return anchor.workspace.Cultures as Program<Cultures>;
  } else {
    const provider = getProvider(wallet);
    let myIdl: any = idl;
    return new Program(myIdl, CULTURES_PROGRAM_ID, provider);
  }
};

export const CULTURES_PROGRAM_ID = new web3.PublicKey(
  "GF36TdsrypzPojynRP4E7UsbQQUrcR2GRnR64oScGZY7"
);
