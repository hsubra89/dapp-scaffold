import { CheckCircleFilled, CheckCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AccountInfo, LAMPORTS_PER_SOL, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Button, Input, List, Space, Typography } from "antd";
import isEqual from 'lodash/isEqual';
import React, { useEffect, useState } from "react";
import { TASKS_LIST_PROGRAM_ID, TASKS_LIST_PROGRAM_MEMORY, TASKS_LIST_PROGRAM_SEED } from "../../constants/programs";
import useDebounce, { useAccountDataFor, useTransactor } from "../../hooks/hooks";
import { createAccountInstruction, createPubKeyForProgram } from "../../utils/effects";

// Represents an item in the List
// Keys are kept intentionally small to increase "packing efficiency"
interface ListItem {
  v: string,
  c: boolean
}

function encodeList<T>(data: T): Buffer {
  return Buffer.from(JSON.stringify(data), 'utf-8')
}

function decodeAsList<T>(buf: Buffer): T[] {
  // Remove all zero-bytes.
  const stripZeroByte = buf.filter(x => x !== 0)

  if (stripZeroByte.length === 0) {
    return []
  } else {
    // This does not perform a copy, so this is really fast.
    const str = Buffer.from(stripZeroByte).toString('utf8')

    // Return type
    return JSON.parse(str) as T[]
  }
}

// Primary Component
export const Main = () => {

  const { publicKey } = useWallet();

  if (publicKey) {
    return <ValidateAccount pubKey={ publicKey } />
  } else {
    return <div>Please connect to a wallet.</div>
  }
}

// Component that validates account existence and SOL.
export const ValidateAccount = (props: { pubKey: PublicKey }) => {

  const { connection } = useConnection()
  const accountData = useAccountDataFor(props.pubKey)

  const [loading, setLoading] = useState(false)
  const [progPubKey, setProgPubKey] = useState<PublicKey>()

  useEffect(() => {
    async function run() {
      setLoading(true)
      const progPubKey = await createPubKeyForProgram(props.pubKey, TASKS_LIST_PROGRAM_SEED, TASKS_LIST_PROGRAM_ID)
      setProgPubKey(progPubKey)
      setLoading(false)
    }

    if (!progPubKey) {
      run()
    }
  }, [props.pubKey, progPubKey])

  const airdrop = async () => {
    setLoading(true)
    await connection.requestAirdrop(props.pubKey, LAMPORTS_PER_SOL * 10)
    setLoading(false)
  }

  if (loading) {
    return <div>Processing ...</div>
  } else {
    if (!accountData) {
      return <Button onClick={ airdrop }>Click here to airdrop some SOL!</Button>
    } else {
      return <PanelFor pubKey={ props.pubKey } accData={ accountData } progPubKey={ progPubKey! } />
    }
  }
}

// Component that validates existence of program account
const PanelFor = (props: { pubKey: PublicKey, accData: AccountInfo<Buffer>, progPubKey: PublicKey }) => {

  const { connection } = useConnection()
  const transactor = useTransactor()

  const [loading, setLoading] = useState(false)
  const progData = useAccountDataFor(props.progPubKey)

  const createAccount = async () => {
    setLoading(true)
    const instruction = await createAccountInstruction(connection, props.pubKey, props.progPubKey, TASKS_LIST_PROGRAM_ID, TASKS_LIST_PROGRAM_SEED, TASKS_LIST_PROGRAM_MEMORY)
    await transactor(instruction)
    setLoading(false)
  }

  const updateList = async (updatedData: ListItem[]) => {

    const encoded = encodeList(updatedData)
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: props.progPubKey, isSigner: false, isWritable: true },
        { pubkey: props.pubKey, isSigner: true, isWritable: false }
      ],
      programId: TASKS_LIST_PROGRAM_ID,
      data: encoded
    })

    await transactor(instruction)
  }

  if (loading) {
    return <div>Loading ....</div>
  } else {

    if (progData) {
      const data = decodeAsList<ListItem>(progData.data)
      return <TaskListManager pubKey={ props.pubKey } progPubKey={ props.progPubKey } progData={ data } updateList={ updateList } balance={ props.accData.lamports } />
    } else {
      return <Button onClick={ createAccount }>Click here to create a task list!</Button>
    }
  }
}

function updateItemInList<T, U>(list: T[], item: T, update: (curr: T) => T): T[] {
  return list
    .map(x => {
      if (x === item) {
        return update(x)
      } else {
        return x
      }
    })
}

// TaskList Manager.
// Maintains local state of tasks.
// Performs optimistic updates to keep the UI fast.
// Sync's changes to the Solana network every 200ms ( if there are unsynced changes ), based on the debounce value set.
const TaskListManager = (props: { balance: number, pubKey: PublicKey, progPubKey: PublicKey, progData: ListItem[], updateList: (changed: ListItem[]) => void }) => {

  const [newItem, setNewItem] = useState<string>("")
  const [taskList, setTaskList] = useState(props.progData)

  // Debounce, task list
  // Protects against "spam" clicks on "completion" toggle.
  const toSyncList = useDebounce<ListItem[]>(taskList, 200)

  // Once debounce'd list is completed, update list against blockchain.
  useEffect(() => {
    // We only want to sync when something has actually changed.
    if (!isEqual(toSyncList, props.progData)) {
      props.updateList(toSyncList)
    }
  }, [toSyncList])

  const performChange = (updatedTaskList: ListItem[]) => {
    setTaskList(updatedTaskList)
  }

  const addItem = () => {

    const v = newItem.trim()

    if (v.length > 0) {
      setNewItem("")
      performChange([...taskList, { v, c: false }])
    }
  }

  const deleteItem = (item: ListItem) => {
    return performChange(taskList.filter(x => x !== item))
  }

  const toggleCompletion = (item: ListItem) => {
    return performChange(updateItemInList(taskList, item, x => ({ ...x, c: !x.c })))
  }

  const editItem = (item: ListItem, newValue: string) => {

    const v = newValue.trim()

    // If the string is empty, it should just be deleted
    if (v.length === 0) {
      return deleteItem(item)
    }

    // No change
    if (v === item.v) {
      return
    }

    return performChange(updateItemInList(taskList, item, x => ({ v, c: false })))
  }

  return (<>
    <List
      size="small"
      grid={ { column: 1 } }
      header={
        <Typography.Text>Available SOL: { props.balance / LAMPORTS_PER_SOL }</Typography.Text>
      }
      footer={
        <List.Item className="list-item">
          <Space align="start">
            <Input bordered={ false } onChange={ e => setNewItem(e.target.value || '') } onPressEnter={ addItem } value={ newItem } placeholder="Add item ..." allowClear></Input>
          </Space>
        </List.Item>
      }
      dataSource={ taskList }
      rowKey={ item => item.v }
      renderItem={ item => (
        <List.Item>
          <Space align="start">
            { item.c ? <CheckCircleFilled onClick={ () => toggleCompletion(item) } /> : <CheckCircleOutlined onClick={ () => toggleCompletion(item) } /> }
            <Typography.Text title={ item.v } editable={ { onChange: (v: string) => editItem(item, v) } }>{ item.v }</Typography.Text>
            <DeleteOutlined onClick={ () => deleteItem(item) } />
          </Space>
        </List.Item>
      ) }
    />
  </>
  )
}
