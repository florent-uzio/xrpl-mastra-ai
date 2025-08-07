# XRPL Mastra AI Template

A comprehensive Mastra.ai template for building XRP Ledger (XRPL) applications with AI agents, tools, and workflows. This template provides a complete foundation for creating intelligent XRPL applications with automated token issuance, account management, and transaction processing.

## Overview

This template demonstrates how to build sophisticated XRPL applications using Mastra.ai's agent, tool, and workflow system. It includes:

- **XRPL Client Management**: Singleton pattern for efficient client connections
- **Comprehensive XRPL Tools**: Public methods, transactions, and wallet management
- **Token Issuance Workflow**: Complete automated token creation and distribution
- **AI Agent Integration**: Intelligent XRPL agent with detailed tool descriptions
- **Type Safety**: Full TypeScript support with Zod validation

The template is designed for **testnet and devnet networks** and provides a production-ready foundation for XRPL development.

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

### Basic Token Issuance

```typescript
import { tokenIssuanceWorkflow } from './src/mastra/workflows/token-issuance-workflow'

const result = await tokenIssuanceWorkflow.execute({
  network: 'wss://s.altnet.rippletest.net:51233/',
  holders: 3,
  trustline: {
    currency: 'REWARDS',
    trustlineLimit: '10000',
  },
  issuerSettings: {
    flags: ['asfDefaultRipple'],
  },
  mintAmount: '1000',
})
```

### Using the XRPL Agent

```typescript
import { mastra } from './src/mastra'

const agent = mastra.getAgent('xrpl-agent')

const response = await agent.generate({
  messages: [
    {
      role: 'user',
      content: 'Create a wallet and fund it with 1000 XRP on testnet',
    },
  ],
})
```

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
- `hexToCurrencyCode` - Convert hex values back to currency codes

## Customization

### Adding New XRPL Methods

1. Create a new tool in `src/mastra/tools/methods/public/`:

```typescript
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const newMethodTool = createTool({
  name: 'new_method',
  description: 'Description of what this method does',
  inputSchema: z.object({
    network: z.string(),
    account: z.string(),
    // ... other parameters
  }),
  execute: async ({ context, mastra }) => {
    // Extract network and request from the context
    const { network, request } = context

    // Use the shared utility function to execute the 'command-name' command
    return await executeMethod({
      network,
      request: { ...request, command: 'command-name' },
      logMessage: 'your-message',
      mastra,
    })
  },
})
```

2. Register the tool in `src/mastra/tools/index.ts`

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

## Contributing

When contributing to this template:

1. **Follow the existing code structure** and patterns
2. **Add comprehensive tests** for new features
3. **Update documentation** for any changes
4. **Use TypeScript** for all new code
5. **Follow XRPL best practices** and security guidelines

## License

This template is part of the XRPL Mastra.ai integration project and follows the same licensing terms as the main project.
