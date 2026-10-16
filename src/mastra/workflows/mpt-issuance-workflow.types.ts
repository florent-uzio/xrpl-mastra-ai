import { encodeMPTokenMetadata, MPTokenIssuanceCreateFlags, validateMPTokenMetadata, Wallet } from 'xrpl'
import z from 'zod'
import { txnResultSchema, workflowNetworkSchema } from './shared'

/**
 * Flag names (e.g. "tfMPTCanTransfer") from xrpl's MPTokenIssuanceCreateFlags enum.
 * Numeric enums also contain reverse mappings (2 -> name), so numeric keys are filtered out.
 *
 * @see https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuancecreate#mptokenissuancecreate-flags
 */
const mptIssuanceFlagNames = Object.keys(MPTokenIssuanceCreateFlags).filter(k => isNaN(Number(k))) as [
  keyof typeof MPTokenIssuanceCreateFlags,
  ...(keyof typeof MPTokenIssuanceCreateFlags)[],
]

/**
 * Token metadata following the XLS-89 standard (explorers and indexers rely on it).
 * Checked with xrpl.js's own validator, so a bad value is rejected before any wallet is funded.
 *
 * @see https://xrpl.org/docs/references/protocol/transactions/types/mptokenissuancecreate#mptokenmetadata-field
 */
const mptMetadataSchema = z
  .object({
    ticker: z.string().describe('Uppercase letters and digits only, max 6 characters, e.g. "TEST"'),
    name: z.string().describe('Token name'),
    desc: z.string().optional().describe('Short description'),
    icon: z.string().describe('URL of the token icon'),
    asset_class: z.string().describe('One of: rwa, memes, wrapped, gaming, defi, other'),
    asset_subclass: z.string().optional().describe('Required when asset_class is rwa, e.g. "treasury"'),
    issuer_name: z.string().describe('Name of the issuer'),
    uris: z
      .array(z.object({ uri: z.string(), category: z.string(), title: z.string() }))
      .optional()
      .describe('Related links (category: website, social, docs, other)'),
    additional_info: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  })
  .superRefine((metadata, ctx) => {
    for (const message of validateMPTokenMetadata(encodeMPTokenMetadata(metadata))) {
      ctx.addIssue({ code: 'custom', message })
    }
  })

/** MPTokenIssuance properties that are set once at creation. */
const issuanceSchema = z.object({
  flags: z
    .array(z.enum(mptIssuanceFlagNames))
    .optional()
    .describe(
      'Issuance flags. tfMPTRequireAuth: the issuer must authorize each holder. tfMPTCanTransfer: holders can send the MPT to each other (required for transferFee). Others: tfMPTCanLock, tfMPTCanEscrow, tfMPTCanTrade, tfMPTCanClawback, tfMPTCanHoldConfidentialBalance. Flags cannot be changed later.',
    ),
  assetScale: z
    .number()
    .int()
    .min(0)
    .max(19)
    .optional()
    .describe('Number of decimal places, e.g. 2 means 100 units = 1.00. Default 0'),
  maximumAmount: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .describe('Maximum supply, in the smallest unit, as an integer string. Default is the protocol maximum (2^63-1)'),
  transferFee: z
    .number()
    .int()
    .min(0)
    .max(50000)
    .optional()
    .describe('Fee charged on holder-to-holder transfers, in 1/100,000 units (50000 = 50%). Needs tfMPTCanTransfer'),
  metadata: mptMetadataSchema.optional().describe('Token metadata (XLS-89), encoded to hex automatically'),
})

/**
 * Workflow input fields, without the cross-field checks.
 * Zod objects with checks cannot be extended, so the steps build on this one.
 */
const mptIssuanceBaseSchema = z.object({
  network: workflowNetworkSchema.describe('Network to use for the workflow'),
  issuance: issuanceSchema.describe('MPT issuance properties'),
  holders: z.number().int().positive().describe('Number of holder wallets to create'),
  mintAmount: z
    .string()
    .regex(/^\d+$/)
    .describe('Amount to send to each holder, in the smallest unit (integer string, ignores assetScale)'),
})

/**
 * Main workflow input schema. Adds the checks the ledger would otherwise only reject after wallets are funded.
 */
export const mptIssuanceWorkflowSchema = mptIssuanceBaseSchema
  .refine(({ issuance }) => !issuance.transferFee || issuance.flags?.includes('tfMPTCanTransfer'), {
    message: 'transferFee requires the tfMPTCanTransfer flag',
    path: ['issuance', 'transferFee'],
  })
  .refine(
    ({ issuance, holders, mintAmount }) =>
      issuance.maximumAmount === undefined || BigInt(mintAmount) * BigInt(holders) <= BigInt(issuance.maximumAmount),
    { message: 'mintAmount * holders exceeds maximumAmount', path: ['mintAmount'] },
  )

const issuerAndHoldersSchema = z.object({
  issuer: z.custom<Wallet>().describe('Issuer wallet'),
  holders: z.array(z.custom<Wallet>().describe('Holder wallet')),
})

/** Output of the wallet step. */
export const walletsSchema = mptIssuanceBaseSchema.extend(issuerAndHoldersSchema.shape)

/** Output of the issuance step and the steps after it. */
export const issuedSchema = walletsSchema.extend({
  mptIssuanceId: z.string().describe('MPTokenIssuanceID of the created issuance'),
  txnResults: z.array(txnResultSchema).describe('Array of transaction results from this step'),
})

/**
 * Workflow output: the last step's output plus where the run was recorded
 */
export const mptIssuanceResultSchema = issuedSchema.extend({
  recordId: z.string().describe('Id of the saved record, usable with the get-flow-records tool'),
  recordPath: z.string().describe('Path of the saved record file'),
})
