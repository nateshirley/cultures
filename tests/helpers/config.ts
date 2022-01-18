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

import {
  PublicKey,
  SystemProgram,
  Connection,
  Commitment,
  Keypair,
} from "@solana/web3.js";

//cluster = "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"
//cluster = "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/"

declare var TextEncoder: any;

// export const getSmartCollectionsProgram = (
//   wallet: any
// ): Program<SmartCollections> => {
//   const provider = getProvider(wallet);
//   let myIdl: any = idl;
//   return new Program(myIdl, SMART_COLLECTIONS_PROGRAM_ID, provider);
// };
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
  return new Connection(endpoint, commitment);
};
export const SMART_COLLECTIONS_PROGRAM_ID = new PublicKey(
  "3aGWrcgYM8KPoBU2BFK97UcLFqxMspijPM3o6TgxXog1"
);
export const ENDPOINT =
  "https://lingering-lingering-mountain.solana-devnet.quiknode.pro/fbbd36836095686bd9f580212e675aaab88204c9/";
