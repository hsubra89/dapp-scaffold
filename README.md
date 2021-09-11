# Task List app on Solana

This project was built on an initial scaffold provided by https://github.com/solana-labs/dapp-scaffold.git. I've deleted most of the code that's present in the original code base. I've raised this patch against the source `dapp-scaffold` repo so that its easier to see the diff. However, I would encourage anyone to just switch to the branch ( and / or clone ) for an easier review.

## Notes

- The app signs every request sent to the wallet. Turn on `auto approve` in your wallet to avoid manually approving every action performed on the task list.
- The program has been deployed on Solana `devnet` with `PROGRAM_ID: GABKmFceR9SmUh2jfeUUANBBryWShuwKEmbuTL1tcHRg`. You won't have to run a localnet instance of solana to use the app. However, you will have to start the frontend build locally to interact with the program.

This app lets you :
- Use a Solana wallet to connect to the app. ( Turn `auto-approve` on )
- Airdrop yourself some SOL.
- Create an account against the program.
- Manage a task list.
    - Add items.
    - Edit items.
    - Complete items.
    - Delete items.

## Solana Program

Written in `rust` @ `program/src/lib.rs`. It defines a relatively simple program that accepts incoming messages, verifies the signature of the sender, validates that the input is a UTF8 string, and then saves it as a byte-array within the bounds of allocated memory. I've deliberately kept the implementation simple, and there are some simple tests defined below the main implementation.

### Instructions for localnet.

- Ensure latest stable `rust` is installed. Use `rustup`.

- Install latest stable of solana-cli based on instructions here : https://docs.solana.com/cli/install-solana-cli-tools
    - If you already have an older version of solana-cli ( atleast v1.7.8 ), update to latest with `solana-install update`.

- Run `yarn program:build` to build the program.
- Switch to the `program` directory and run `cargo test` to run tests.
- Run `solana-test-validator`
- Run `solana config set --url localhost`
- Run `solana program deploy <path-to-here>/dapp-scaffold/program/target/deploy/bpf_program_template.so`. The logs for the previous command should list the full deploy command.
- Take note of the program id that's displayed in the logs and update the value of `TASKS_LIST_PROGRAM_ID` in `src/constants/program.ts` so that the frontend app knows the address.

## Frontend dApp

**NOTE** : I am not a frontend developer, I don't do UI's and designs very well. This is a fully functional implementation. However, it does not look very good and is very minimal.

Written in `typescript` with `React`. It defines a relatively simple implementation of (hierarchical) components to render the task list. Some of the major points:

- Connects by default to the instance of this program that's deployed on `devnet`. If the connection fails for some reason, redeploy the program based on the instructions above.
- Supports most major Solana wallets. ( I've only tested it with Phantom, but the others should work as well. )
- A very simple component hierarchy is defined which steps through the process of `airdropping SOL`, `creating a program account` and then `manipulating the task list`.
- Task list is optimistically updated. Changes are synced to the blockchain every 200ms.
- I've allocated `1024 bytes` of memory for this program account.
    - This means the final encoded JSON should not exceed 1024 bytes.
    - There are better serializers and serializing formats we can use for better packing.
    - We can also increase the memory allocation size ( up to 10MB ). However, I think `1024` bytes is sufficient for this implementation.

### Instructions to run
- Run `yarn install`.
- Run `yarn start`.
- If you're running against solana `localnet`, update the program-id in `src/constants/program.ts` appropriately.

---------------------------------------------
# 🏗 Solana App Scaffold
Scaffolding for a dapp built on Solana

# Quickstart

```bash
git clone https://github.com/solana-labs/dapp-scaffold.git

cd dapp-scaffold
```

```bash

yarn

```

```bash

yarn start

```

# Environment Setup
1. Install Rust from https://rustup.rs/
2. Install Solana v1.6.7 or later from https://docs.solana.com/cli/install-solana-cli-tools#use-solanas-install-tool
3. Install Node
4. Install NPM, Yarn

# Build Smart Contract (compiled for BPF)
Run the following from the program/ subdirectory:

```bash
$ cargo build-bpf
$ cargo test-bpf
```
# Directory structure

## program

Solana program template in Rust

### program/src/lib.rs
* process_instruction function is used to run all calls issued to the smart contract

## src/actions

Setup here actions that will interact with Solana programs using sendTransaction function

## src/contexts

React context objects that are used propagate state of accounts across the application

## src/hooks

Generic react hooks to interact with token program:
* useUserBalance - query for balance of any user token by mint, returns:
    - balance
    - balanceLamports
    - balanceInUSD
* useUserTotalBalance - aggregates user balance across all token accounts and returns value in USD
    - balanceInUSD
* useAccountByMint
* useTokenName
* useUserAccounts

## src/views

* home - main page for your app
* faucet - airdrops SOL on Testnet and Devnet
