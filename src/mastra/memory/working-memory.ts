import z from 'zod'

/**
 * What the agent keeps across threads for one resource (resource-scoped working memory).
 * Seeds and private keys are only ever stored for testnet/devnet: the agent keeps just the address / public key elsewhere.
 */
export const workingMemorySchema = z.object({
  network: z.string().optional().describe('WebSocket URL of the network currently in use'),
  wallets: z
    .array(
      z.object({
        label: z.string().describe('Role or nickname, e.g. "issuer", "holder1"'),
        network: z.string().describe('WebSocket URL the wallet was created or funded on'),
        address: z.string(),
        seed: z.string().optional().describe('Testnet/devnet only. Never store a mainnet seed'),
      }),
    )
    .optional(),
  mptIssuances: z
    .array(
      z.object({
        id: z.string().describe('MPTokenIssuanceID'),
        issuer: z.string().describe('Issuer address'),
        network: z.string(),
        notes: z.string().optional().describe('Flags, metadata, confidentiality, ...'),
      }),
    )
    .optional(),
  elgamalKeys: z
    .array(
      z.object({
        owner: z.string().describe('Address the key belongs to'),
        mptIssuanceId: z.string().optional(),
        publicKey: z.string(),
        privateKey: z.string().optional().describe('Testnet/devnet only'),
      }),
    )
    .optional(),
  other: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .optional()
    .describe('Any other value worth reusing later: IOU currency codes, vault IDs, tx hashes, ...'),
})
