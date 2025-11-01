import { unzipSync } from "fflate";

export function unzip(bytes: Uint8Array){
  const files = unzipSync(bytes); // { [name]: Uint8Array }
  const toText = (u8: Uint8Array) => new TextDecoder().decode(u8);
  return { files, toText };
}
