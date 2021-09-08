import { SendTransactionOptions } from "@solana/wallet-adapter-base"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { AccountInfo, Commitment, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js"
import { useCallback, useEffect, useState } from "react"

/**
 * Effect that returns account data
 */
export function useAccountDataFor(pubKey: PublicKey, commitment: Commitment = 'singleGossip') {

  const { connection } = useConnection()
  const [accData, setAccData] = useState<AccountInfo<Buffer> | null>(null)

  useEffect(() => {
    const accChangeListener = connection.onAccountChange(pubKey, setAccData, commitment)
    connection.getAccountInfo(pubKey).then(setAccData)

    return () => {
      connection.removeAccountChangeListener(accChangeListener)
    }
  }, [pubKey, connection])

  return accData
}

// Avoid simulating transaction for performance in production.
const DEFAULT_TXN_OPTIONS: SendTransactionOptions = {
  skipPreflight: true,
  preflightCommitment: 'singleGossip'
}

/**
 * A transactor hook that updates the blockchain
 */
export function useTransactor(txnOptions: SendTransactionOptions = DEFAULT_TXN_OPTIONS) {

  const { connection } = useConnection()
  const { sendTransaction } = useWallet()

  return useCallback(async (instruction: TransactionInstruction) => {
    const txn = new Transaction().add(instruction)
    const txnId = await sendTransaction(txn, connection, txnOptions)
    return connection.confirmTransaction(txnId, txnOptions.preflightCommitment)
  }, [connection, sendTransaction])
}

/**
 * Debounce Effect
 */
export default function useDebounce<T>(value: T, delay: number) {

  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  },
    [value])

  return debouncedValue
}
