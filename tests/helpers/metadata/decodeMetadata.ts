import { deserializeUnchecked, BinaryReader, BinaryWriter } from "borsh";
import { MetadataData } from "./accounts/Metadata";

export const decodeMetadataV2 = (buffer: Buffer) => {
  const metadata = deserializeUnchecked(
    MetadataData.SCHEMA,
    MetadataData,
    buffer
  ) as MetadataData;

  // Remove any trailing null characters from the deserialized strings
  metadata.data.name = metadata.data.name.replace(/\0/g, "");
  metadata.data.symbol = metadata.data.symbol.replace(/\0/g, "");
  metadata.data.uri = metadata.data.uri.replace(/\0/g, "");
  metadata.data.name = metadata.data.name.replace(/\0/g, "");
  return metadata;
};
