# XRPL Mastra AI Template

A comprehensive Mastra.ai template for building XRP Ledger (XRPL) applications with AI agents, tools, and workflows. This template provides a complete foundation for creating intelligent XRPL applications with automated token issuance, account management, and transaction processing.

## Overview

This template demonstrates how to build sophisticated XRPL applications using Mastra.ai's agent, tool, and workflow system. It includes:

- **XRPL Client Management**: Singleton pattern for efficient client connections
- **Comprehensive XRPL Tools**: Public methods, transactions, and wallet management
- **IOU Issuance Workflow**: Complete automated IOU (trust line token) creation and distribution
- **Lending Setup Workflow**: Sets up the Lending Protocol on devnet (MPT, closed-ended vault, deposit, loan broker and cover)
- **AI Agent Integration**: Intelligent XRPL agent with detailed tool descriptions
- **Type Safety**: Full TypeScript support with Zod validation

## Setup

1. **Copy environment variables**:

   ```bash
   cp .env.example .env
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure your API keys** in `.env` (see Environment Variables section)

4. **Start development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key. Get one at [OpenAI Platform](https://platform.openai.com/api-keys)

## Use the tools from Claude Code (MCP server)

`npx -y @florent-uzio/xrpl-mcp` starts a local stdio MCP server that exposes every XRPL tool and the four workflows (`iou-issuance`, `mpt-issuance`, `confidential-mpt`, `lending-setup`). It never exposes the Mastra agent, so Claude Code does the reasoning on your own subscription and no model key is involved. The server's instructions are the same rules the agent follows.

Add it to Claude Code from any folder:

```bash
claude mcp add xrpl -- npx -y @florent-uzio/xrpl-mcp
```

Flow records (wallets, MPT IDs, keys, hashes) are stored in `~/.xrpl-mastra-ai/records` by default. Set `XRPL_RECORDS_DIR` to use another folder (`--env XRPL_RECORDS_DIR=...`), and set `XRPL_RECORDS_DIR=~/.xrpl-mastra-ai/records` in this repo's `.env` so Mastra Studio reads and writes the same records.

To run the server from a clone of the repo instead, use `npm run mcp` (`claude mcp add xrpl -- npm --prefix "$(pwd)" run --silent mcp`).

`npx` picks up a new release the next time Claude Code starts the server: start a new session, or reconnect `xrpl` from `/mcp`. If you still get the old version, or `npx` reports `No matching version found`, your npm cache holds outdated package data. Refresh it once (the server then waits for input: stop it with Ctrl+C), then reconnect:

```bash
npx -y --prefer-online @florent-uzio/xrpl-mcp
```

Releases of the package follow [RELEASING.md](https://github.com/florent-uzio/xrpl-mastra-ai/blob/main/RELEASING.md).

### Custom test networks

Wallet seeds are refused in code on any network that is not a test network, before any connection is made. The known test networks are the testnet, devnet and Xahau testnet URLs (including their Clio, honeycluster and xrpl-labs alternatives). To use a seed on another test network, add its URL to `XRPL_EXTRA_TEST_NETWORKS` (comma-separated) in the environment of the process that runs the tools:

```bash
claude mcp add xrpl --env XRPL_EXTRA_TEST_NETWORKS=wss://my-testnet.example.com/,ws://localhost:6006 -- npx -y @florent-uzio/xrpl-mcp
```

On mainnet, sign the transaction yourself and pass the `signature`: signed transactions are accepted on any network.

## Usage

You can use the XRPL Agent to do several things that the XRP Ledger and xrpl.js SDK allows. For example:

- Creating accounts on mainnet, testnet and devnet
- Funding those accounts using the faucet on test networks
- Quering the XRP Ledger to retrieve any kind of data
- Submitting transactions such as a Payment or minting an NFT

### Available Tools

The template includes comprehensive XRPL tools:

#### Public Methods

- `account_info` - Get account information and balances
- `account_lines` - Retrieve trust lines for an account
- `account_nfts` - Get NFT tokens owned by an account
- `account_objects` - Retrieve account-specific ledger objects
- `account_offers` - Get open offers for an account
- `account_tx` - Get transaction history for an account
- `account_channels` - Retrieve payment channels for an account
- `account_currencies` - Get currencies an account can send or receive
- `gateway_balances` - Get balances held by gateways
- `server_info` - Get server information and status
- `fee` - Get current transaction fees
- `feature` - Get the status of protocol amendments
- `manifest` - Look up a validator's public manifest
- `server_definitions` - Get serialization definitions, formats and flags
- `server_state` - Get machine-readable server status
- `version` - Get the supported API version range
- `noripple_check` - Check DefaultRipple/NoRipple flag settings
- `ledger`, `ledger_closed`, `ledger_current`, `ledger_data`, `ledger_entry` - Read ledgers and raw ledger entries
- `tx`, `transaction_entry` - Look up a transaction by hash
- `submit` - Submit a pre-signed transaction blob
- `amm_info`, `book_offers`, `deposit_authorized`, `ripple_path_find` - AMM pools, order books, deposit authorization and payment paths
- `nft_buy_offers`, `nft_sell_offers` - Open offers for an NFT
- `nft_info`, `nft_history`, `nfts_by_issuer` - NFT details and history (Clio servers only)
- `channel_verify` - Verify a payment channel claim signature
- `vault_info` - Get a single-asset vault and its shares
- `ping`, `random` - Server liveness and random bytes

#### Transactions

- `AccountSet` - Configure account settings and flags
- `AMMCreate` - Create Automated Market Makers
- `Clawback` - Recover issued currencies
- `LoanBrokerCoverClawback` - Claw back first-loss capital from a loan broker
- `LoanBrokerCoverDeposit` - Deposit first-loss capital into a loan broker
- `LoanBrokerCoverWithdraw` - Withdraw first-loss capital from a loan broker
- `LoanBrokerDelete` - Delete a loan broker
- `LoanBrokerSet` - Create or update a loan broker
- `LoanDelete` - Delete a loan
- `LoanManage` - Default, impair or unimpair a loan
- `LoanPay` - Make a loan payment
- `LoanSet` - Create a loan
- `sign-loan-set` - Sign a LoanSet as both the broker owner and the borrower (testnet/devnet), for `submit`
- `prepare-loan-set` - Autofill an unsigned LoanSet for both parties to sign on their own machines (any network, mainnet included)
- `NFTokenMint` - Create new NFT tokens
- `OfferCancel` - Cancel existing offers
- `OfferCreate` - Create exchange offers
- `Payment` - Send XRP or issued currencies
- `TrustSet` - Create or modify trust lines
- `VaultClawback` - Claw back assets or shares from a vault
- `VaultCreate` - Create a single-asset vault
- `VaultDelete` - Delete an empty vault
- `VaultDeposit` - Deposit assets into a vault for shares
- `VaultSet` - Update a vault
- `VaultWithdraw` - Redeem vault shares for assets

#### Utilities

- `createWallet` - Generate new XRPL wallets
- `fundWalletWithFaucet` - Fund wallets using testnet faucets
- `currencyCodeToHex` - Convert currency codes to hex format

## Customization

### Adding New Transaction Tools

The template provides a factory pattern for creating new XRPL transaction tools with minimal boilerplate. Here's how to add a new transaction tool:

#### 1. Create Transaction Schema

First, define the Zod schema for your transaction fields:

```typescript
// src/mastra/tools/transactions/your-transaction/your-transaction.types.ts
import { z } from 'zod'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

export const xrplYourTransactionFieldsSchema = z.object({
  // Define your transaction-specific fields here
  Amount: z.string().describe('Amount to transfer'),
  Destination: z.string().describe('Destination account'),
  // ... other fields
})

export const xrplYourTransactionSchema = xrplCommonFieldsSchema
  .merge(xrplYourTransactionFieldsSchema)
  .extend({ TransactionType: z.literal('YourTransactionType') })
```

#### 2. Create the Transaction Tool

Use the factory to create your transaction tool:

```typescript
// src/mastra/tools/transactions/your-transaction/your-transaction.ts
import { YourTransactionType } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplYourTransactionSchema } from './your-transaction.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplYourTransactionSchema,
})

export const submitYourTransactionTool = createTransactionTool({
  toolId: 'submit-your-transaction',
  description: `Submit a YourTransactionType transaction to the XRPL network. 
  
  ## Important Notes:
  - Explain what this transaction does
  - List any special requirements or limitations
  - Include relevant XRPL documentation links`,
  buildTransaction: params => {
    const builtTransaction: YourTransactionType = {
      TransactionType: 'YourTransactionType',
      ...params,
    }
    return builtTransaction
  },
  validateTransaction: params => {
    // Add any custom validation logic
    if (!params.Amount) {
      throw new Error('Amount is required')
    }
  },
})
```

#### 3. Example: Payment Transaction

Here's a real example from the template:

```typescript
// src/mastra/tools/transactions/payment/payment.ts
import { Payment } from 'xrpl'
import { useTransactionToolFactory } from '../factory'
import { xrplPaymentSchema } from './payment.types'

const { createTransactionTool } = useTransactionToolFactory({
  inputSchema: xrplPaymentSchema,
})

export const submitPaymentTool = createTransactionTool({
  toolId: 'submit-payment',
  description: `Submit a Payment transaction to the XRPL network. A Payment transaction represents a transfer of value from one account to another. This is the only transaction type that can create new accounts by sending enough XRP to an unfunded address.

## Important Notes:
- Payment is the only transaction type that can create accounts
- Cross-currency payments may involve multiple exchanges atomically
- Partial payments can exploit integrations that assume exact delivery amounts`,
  buildTransaction: payment => {
    const builtPayment: Payment = {
      ...payment,
      Amount: payment.Amount ?? payment.DeliverMax,
    }
    return builtPayment
  },
  validateTransaction: params => {
    if (params.Amount === undefined && params.DeliverMax === undefined) {
      throw new Error('Provide Amount (API v1) or DeliverMax (API v2)')
    }
  },
})
```

#### 4. Factory Benefits

The transaction factory provides several benefits:

- **Automatic Authentication**: Handles seed/signature validation automatically
- **Consistent Schema**: Merges common fields (network, seed, signature) with your transaction fields
- **Type Safety**: Full TypeScript support with proper type inference
- **Error Handling**: Centralized error handling and validation
- **Reduced Boilerplate**: No need to repeat common transaction submission logic

#### 5. Available Common Fields

All transaction tools automatically include these base fields:

- `network`: WebSocket URL for the XRPL network
- `seed`: Seed phrase for testnet/devnet accounts (optional)
- `signature`: Pre-signed transaction signature (optional)

Either `seed` or `signature` must be provided for authentication.

#### 6. Adding to Your Agent

After creating your tool, add it to the agent's tools object:

```typescript
// src/mastra/agents/xrpl-agent.ts
import { submitYourTransactionTool } from '../tools/transactions/your-transaction/your-transaction'

export const xrplAgent = new Agent({
  // ... other config
  tools: {
    // ... existing tools
    submitYourTransactionTool,
  },
})
```

### Customizing Existing Tools

You can customize existing tools by:

1. **Modifying Descriptions**: Update tool descriptions to better match your use case
2. **Adding Validation**: Enhance validation logic for your specific requirements
3. **Extending Schemas**: Add additional fields or constraints to existing schemas
4. **Custom Error Handling**: Implement custom error messages and handling

### Best Practices for Customization

- **Follow Naming Conventions**: Use consistent naming for files and exports
- **Add Comprehensive Documentation**: Include detailed descriptions and examples
- **Validate Inputs**: Always validate transaction parameters before submission
- **Handle Errors Gracefully**: Provide clear error messages for debugging
- **Test Thoroughly**: Test your custom tools on testnet before mainnet use

## Supported Networks

By default, mainnet will be used, if you need to use another network, simply mention "testnet" or "devnet" in your prompt.

## IOU Issuance Workflow

The template includes a complete IOU (trust line token) issuance workflow, not applicable to MPTs, that:

1. **Creates Wallets** - Generates and funds issuer and holder wallets
2. **Configures Issuer** - Sets account flags and domain (optional)
3. **Establishes Trust Lines** - Creates trust lines for token acceptance
4. **Mints Tokens** - Distributes tokens to all holders

### Workflow Parameters

| Parameter                  | Type     | Description                         | Example                                  |
| -------------------------- | -------- | ----------------------------------- | ---------------------------------------- |
| `network`                  | string   | WebSocket URL for XRPL network      | `'wss://s.altnet.rippletest.net:51233/'` |
| `holders`                  | number   | Number of holder wallets to create  | `3`                                      |
| `trustline.currency`       | string   | Currency code for the token         | `'REWARDS'`                              |
| `trustline.trustlineLimit` | string   | Trust line limit for each holder    | `'10000'`                                |
| `issuerSettings.domain`    | string   | Issuer domain (optional)            | `'example.com'`                          |
| `issuerSettings.flags`     | string[] | Account flags (optional)            | `['asfDefaultRipple']`                   |
| `mintAmount`               | string   | Amount of tokens to mint per holder | `'1000'`                                 |

## Lending Setup Workflow

Sets up the XRPL Lending Protocol (XLS-66) on devnet, up to the point where a loan can be created. Devnet only: the `LendingProtocolV1_1` amendment (closed-ended vaults) is not enabled on testnet yet.

1. **Creates Wallets** - Funds a vault owner (also the loan broker owner), a depositor and a borrower, plus an issuer for a new MPT
2. **Creates the MPT** - A transferable MPT (vaults require `tfMPTCanTransfer`), or reuses an existing one
3. **Distributes the MPT** - Each wallet opts in and receives `mintAmount`
4. **Creates a Closed-Ended Vault** - `SubscriptionDate` and `RedemptionDate` counted from ledger time
5. **Deposits** - The depositor deposits `depositAmount` during the Subscription phase
6. **Creates the Loan Broker** - Then deposits `coverAmount` of first-loss capital

The loan itself is left to the agent and the `sign-loan-set`, `LoanPay`, `LoanManage` tools: it can only be created after `SubscriptionDate`, and its last payment must be at least 60 s before `RedemptionDate`.

### Workflow Parameters

Amounts are in the MPT's smallest unit (integer strings). Rates are in 1/10 basis points (10000 = 10%). Every parameter except `network` has a default.

| Parameter              | Type   | Description                                                                               | Default                               |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------- | ------------------------------------- |
| `network`              | string | Devnet WebSocket URL                                                                      | -                                     |
| `issuance`             | object | `{ source: 'create', assetScale }` or `{ source: 'existing', mptIssuanceId, issuerSeed }` | `{ source: 'create', assetScale: 2 }` |
| `mintAmount`           | string | Sent to the vault owner, depositor and borrower each                                      | `'100000000'` (1,000,000.00)          |
| `depositAmount`        | string | Deposited into the vault                                                                  | `'50000000'` (500,000.00)             |
| `coverAmount`          | string | First-loss capital deposited into the loan broker                                         | `'5000000'` (50,000.00)               |
| `managementFeeRate`    | number | Share of loan interest kept by the broker (max 10000)                                     | `5000` (5%)                           |
| `coverRateMinimum`     | number | Share of the broker debt the cover must cover                                             | `10000` (10%)                         |
| `coverRateLiquidation` | number | Share of the minimum cover moved to the vault on a default                                | `50000` (50%)                         |
| `subscriptionSeconds`  | number | Seconds from now until `SubscriptionDate` (min 60)                                        | `300`                                 |
| `investmentSeconds`    | number | Seconds between `SubscriptionDate` and `RedemptionDate` (min 180)                         | `3600`                                |

## Best Practices

### Security

- Always use testnet/devnet for development and testing
- Store wallet seeds securely in production
- Validate all inputs before processing
- Use appropriate account flags for your use case

### Code Quality

- Follow TypeScript best practices
- Use Zod for input validation
- Add comprehensive error handling
- Include detailed documentation and comments
