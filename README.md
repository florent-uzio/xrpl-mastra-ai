# XRPL Mastra AI Template

A comprehensive Mastra.ai template for building XRP Ledger (XRPL) applications with AI agents, tools, and workflows. This template provides a complete foundation for creating intelligent XRPL applications with automated token issuance, account management, and transaction processing.

## Overview

This template demonstrates how to build sophisticated XRPL applications using Mastra.ai's agent, tool, and workflow system. It includes:

- **XRPL Client Management**: Singleton pattern for efficient client connections
- **Comprehensive XRPL Tools**: Public methods, transactions, and wallet management
- **Token Issuance Workflow**: Complete automated token creation and distribution
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

#### Transactions

- `AccountSet` - Configure account settings and flags
- `AMMCreate` - Create Automated Market Makers
- `Clawback` - Recover issued currencies
- `NFTokenMint` - Create new NFT tokens
- `OfferCancel` - Cancel existing offers
- `OfferCreate` - Create exchange offers
- `Payment` - Send XRP or issued currencies
- `TrustSet` - Create or modify trust lines

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

## Token Issuance Workflow

The template includes a complete token issuance workflow that:

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
