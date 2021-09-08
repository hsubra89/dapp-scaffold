import { SystemProgram } from "@solana/web3.js"
import { Connection, PublicKey } from "@solana/web3.js"

export async function createAccountInstruction(
  connection: Connection,
  pubKey: PublicKey,
  programAccKey: PublicKey,
  programId: PublicKey,
  seed: string,
  space: number) {

  const lamports = await connection.getMinimumBalanceForRentExemption(space)

  const instruction = SystemProgram.createAccountWithSeed({
    fromPubkey: pubKey,
    basePubkey: pubKey,
    newAccountPubkey: programAccKey,
    seed,
    lamports,
    space,
    programId: programId,
  })

  return instruction
}

export function createPubKeyForProgram(pubKey: PublicKey, seed: string, programId: PublicKey): Promise<PublicKey> {
  return PublicKey
    .createWithSeed(
      pubKey,
      seed,
      programId
    )
}
