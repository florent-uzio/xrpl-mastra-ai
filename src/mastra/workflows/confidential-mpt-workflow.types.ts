import { MPTokenIssuanceCreateFlags } from 'xrpl'
import z from 'zod'
import { mptMetadataSchema } from './mpt-issuance-workflow.types'
import { workflowNetworkSchema } from '../../helpers'
import { addressSchema, resultShape, txnResultSchema, walletRecordSchema } from './shared'

/**
 * The ConfidentialTransfer amendment is only available on devnet for now.
 *
 * @see https://xrpscan.com/amendment/ConfidentialTransfer
 */
export const confidentialNetworkSchema = workflowNetworkSchema(
  ['devnet'],
  'Network to use. Devnet only until the ConfidentialTransfer amendment passes',
)

/** Flag names from xrpl's MPTokenIssuanceCreateFlags enum (numeric keys are the enum's reverse mappings). */
const issuanceFlagNames = Object.keys(MPTokenIssuanceCreateFlags).filter(k => isNaN(Number(k))) as [
  keyof typeof MPTokenIssuanceCreateFlags,
  ...(keyof typeof MPTokenIssuanceCreateFlags)[],
]

const amountSchema = z.string().regex(/^[1-9]\d*$/, 'Must be a positive integer string')

/** Checks run even when the amount's own regex failed, so invalid strings must not throw. */
const toBigInt = (value?: string) => (value && /^\d+$/.test(value) ? BigInt(value) : 0n)

/**
 * Where an account comes from. Always explicit, so that the caller has to choose between a new funded wallet
 * and an existing one.
 */
const accountSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('generate').describe('Create a new wallet and fund it from the faucet') }),
  z.object({
    source: z.literal('seed').describe('Use an existing account'),
    seed: z.string().describe('XRPL family seed of the account'),
    confidentialSeed: z
      .string()
      .optional()
      .describe(
        'Seed of the confidential (ElGamal) keypair. Required when the account already registered its encryption key on this issuance, since the key cannot be recovered. Saved in the records of earlier runs.',
      ),
  }),
])

/** Workflow input fields, without the cross-field checks (zod objects with checks cannot be extended). */
const confidentialMptBaseSchema = z.object({
  network: confidentialNetworkSchema,
  issuer: accountSchema.describe('The issuer account: generate a new one or use an existing one by seed'),
  issuance: z
    .discriminatedUnion('source', [
      z.object({
        source: z.literal('create').describe('Issue a new MPT from the issuer account'),
        flags: z
          .array(z.enum(issuanceFlagNames))
          .optional()
          .describe(
            'Extra flags, e.g. tfMPTRequireAuth. tfMPTCanTransfer and tfMPTCanHoldConfidentialBalance are always set',
          ),
        metadata: mptMetadataSchema.optional().describe('Token metadata (XLS-89), encoded to hex automatically'),
      }),
      z.object({
        source: z.literal('existing').describe('Reuse an MPT issued by the issuer account'),
        mptIssuanceId: z.string().describe('MPTokenIssuanceID. It must have tfMPTCanHoldConfidentialBalance'),
      }),
    ])
    .describe('Create a new MPT issuance or reuse an existing one'),
  auditor: z
    .boolean()
    .optional()
    .describe(
      'Register an auditor encryption key on the issuance, so every confidential amount is also encrypted for the auditor. A new keypair is generated and its seed returned',
    ),
  holder: accountSchema.describe('The holder account: generate a new one or use an existing one by seed'),
  convertAmount: amountSchema.describe(
    'Amount the holder converts from its public to its confidential balance (smallest unit, integer string). Minted to the holder first if it holds less',
  ),
  send: z
    .object({
      amount: amountSchema.describe('Amount to send confidentially from the holder to the destination'),
      destination: accountSchema.describe('The destination account: generate a new one or use an existing one by seed'),
    })
    .optional()
    .describe('Optional ConfidentialMPTSend from the holder to a second holder'),
  convertBack: z
    .object({ amount: amountSchema.describe('Amount the holder converts back to its public balance') })
    .optional()
    .describe('Optional ConfidentialMPTConvertBack by the holder, after the send if any'),
})

export const confidentialMptWorkflowSchema = confidentialMptBaseSchema
  .refine(({ issuer, issuance }) => issuance.source === 'create' || issuer.source === 'seed', {
    message: 'An existing issuance needs the seed of its issuer',
    path: ['issuer'],
  })
  .refine(
    ({ holder, convertAmount, send, convertBack }) =>
      // an existing holder may already have a confidential balance, so only a new one can be checked up front
      holder.source === 'seed' || toBigInt(send?.amount) + toBigInt(convertBack?.amount) <= toBigInt(convertAmount),
    { message: 'send.amount + convertBack.amount exceeds convertAmount', path: ['convertAmount'] },
  )

/** The confidential seeds of every account of the run, saved in the record so later runs can reuse the accounts. */
const confidentialSeedsSchema = z.object({
  issuer: z.string().optional().describe('Only set when this run registered the issuer key'),
  holder: z.string(),
  destination: z.string().optional(),
  auditor: z.string().optional().describe('Only set when this run registered the auditor key'),
})

/** State passed from step to step. */
export const confidentialStateSchema = confidentialMptBaseSchema.extend({
  issuerWallet: walletRecordSchema.describe('Issuer wallet'),
  holderWallet: walletRecordSchema.describe('Holder wallet'),
  destinationWallet: walletRecordSchema.optional().describe('Destination wallet, when a send was requested'),
  confidentialSeeds: confidentialSeedsSchema,
  mptIssuanceId: z.string(),
  txnResults: z.array(txnResultSchema).describe('Transaction results so far'),
})

const balancesSchema = z.object({
  publicBalance: z.string(),
  confidentialSpendingBalance: z.string(),
})

/** Workflow output: the final state plus the balances read back from the ledger and where the run was recorded. */
export const confidentialMptResultSchema = z.object({
  ...resultShape,
  mptIssuanceId: z.string(),
  issuer: addressSchema,
  holder: addressSchema,
  destination: addressSchema.optional(),
  balances: z.object({ holder: balancesSchema, destination: balancesSchema.optional() }),
})
