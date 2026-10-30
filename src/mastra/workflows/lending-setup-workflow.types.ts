import { Wallet } from 'xrpl'
import z from 'zod'
import { txnResultSchema, workflowNetworkSchema } from './shared'

/**
 * LendingProtocolV1_1 (closed-ended vaults) is only enabled on devnet for now.
 *
 * @see https://xrpl.org/resources/known-amendments#lendingprotocolv1_1
 */
export const lendingNetworkSchema = workflowNetworkSchema.extract([
  'wss://s.devnet.rippletest.net:51233/',
  'wss://clio.devnet.rippletest.net:51233/',
])

const amountSchema = z.string().regex(/^[1-9]\d*$/, 'Must be a positive integer string')

/** Rates in 1/10 basis points: 10000 = 10%. */
const rateSchema = (max: number) => z.number().int().min(0).max(max)

/** Checks run even when the amount's own regex failed, so invalid strings must not throw. */
const toBigInt = (value?: string) => (value && /^\d+$/.test(value) ? BigInt(value) : 0n)

/**
 * Minimum length of the Investment phase (RedemptionDate - SubscriptionDate) and the exclusive maximum (30 years).
 *
 * @see https://xrpl.org/docs/references/protocol/transactions/types/vaultcreate
 */
const MIN_INVESTMENT_SECONDS = 180
const MAX_INVESTMENT_SECONDS = 946708560

/** Workflow input fields, without the cross-field checks (zod objects with checks cannot be extended). */
const lendingSetupBaseSchema = z.object({
  network: lendingNetworkSchema.describe('Network to use. Devnet only until the LendingProtocolV1_1 amendment passes'),
  issuance: z
    .discriminatedUnion('source', [
      z.object({
        source: z.literal('create').describe('Issue a new MPT (with tfMPTCanTransfer) from a new issuer wallet'),
        assetScale: z
          .number()
          .int()
          .min(0)
          .max(19)
          .default(2)
          .describe('Number of decimal places, e.g. 2 means 100 units = 1.00. Default 2'),
      }),
      z.object({
        source: z.literal('existing').describe('Reuse an existing MPT'),
        mptIssuanceId: z.string().describe('MPTokenIssuanceID. It must have tfMPTCanTransfer, which vaults require'),
        issuerSeed: z.string().describe('Seed of the issuer account, used to send the MPT to the new wallets'),
      }),
    ])
    .default({ source: 'create', assetScale: 2 })
    .describe('Create a new MPT (default) or reuse an existing one. Ask the user which one they want'),
  mintAmount: amountSchema
    .default('100000000')
    .describe(
      'Amount sent to each of the vault owner, depositor and borrower, in the smallest unit (integer string, ignores the asset scale). Default 100000000 (1,000,000.00 at scale 2)',
    ),
  depositAmount: amountSchema
    .default('50000000')
    .describe('Amount the depositor puts in the vault, smallest unit. Default 50000000 (500,000.00 at scale 2)'),
  coverAmount: amountSchema
    .default('5000000')
    .describe(
      'First-loss capital the vault owner deposits into the loan broker, smallest unit. Default 5000000 (50,000.00 at scale 2)',
    ),
  managementFeeRate: rateSchema(10000)
    .default(5000)
    .describe('Share of loan interest kept by the broker, in 1/10 basis points (0-10000 = 0-10%). Default 5000 (5%)'),
  coverRateMinimum: rateSchema(100000)
    .default(10000)
    .describe(
      'Share of the broker debt the first-loss capital must cover, in 1/10 basis points (0-100000). Default 10000 (10%)',
    ),
  coverRateLiquidation: rateSchema(100000)
    .default(50000)
    .describe(
      'Share of the minimum cover moved to the vault on a default, in 1/10 basis points (0-100000). Default 50000 (50%)',
    ),
  subscriptionSeconds: z
    .number()
    .int()
    .min(60)
    .default(300)
    .describe(
      'Seconds from now (ledger time) until SubscriptionDate. Deposits are only allowed before it and loans only after it. Default 300',
    ),
  investmentSeconds: z
    .number()
    .int()
    .min(MIN_INVESTMENT_SECONDS)
    .max(MAX_INVESTMENT_SECONDS - 1)
    .default(3600)
    .describe(
      'Seconds between SubscriptionDate and RedemptionDate: the window in which loans can be created and must be repaid (final payment at least 60 s before RedemptionDate). Min 180. Default 3600',
    ),
})

/**
 * Main workflow input schema. Adds the checks the ledger would otherwise only reject after wallets are funded.
 */
export const lendingSetupWorkflowSchema = lendingSetupBaseSchema
  .refine(({ depositAmount, mintAmount }) => toBigInt(depositAmount) <= toBigInt(mintAmount), {
    message: 'depositAmount exceeds mintAmount',
    path: ['depositAmount'],
  })
  .refine(({ coverAmount, mintAmount }) => toBigInt(coverAmount) <= toBigInt(mintAmount), {
    message: 'coverAmount exceeds mintAmount',
    path: ['coverAmount'],
  })
  .refine(({ coverRateMinimum, coverRateLiquidation }) => (coverRateMinimum === 0) === (coverRateLiquidation === 0), {
    message: 'coverRateMinimum and coverRateLiquidation must both be zero or both be non-zero',
    path: ['coverRateLiquidation'],
  })

const walletsShape = {
  issuer: z.custom<Wallet>().describe('MPT issuer wallet'),
  vaultOwner: z.custom<Wallet>().describe('Vault owner, also the loan broker owner'),
  depositor: z.custom<Wallet>().describe('Depositor wallet'),
  borrower: z.custom<Wallet>().describe('Borrower wallet, used later for LoanSet and LoanPay'),
}

/** Output of the wallet step. */
export const walletsSchema = lendingSetupBaseSchema.extend(walletsShape)

/** Output of the issuance step and the steps up to the vault. */
export const issuedSchema = walletsSchema.extend({
  mptIssuanceId: z.string().describe('MPTokenIssuanceID of the vault asset'),
  txnResults: z.array(txnResultSchema).describe('Array of transaction results so far'),
})

/** Output of the vault step and the steps after it. */
export const vaultSchema = issuedSchema.extend({
  vaultId: z.string().describe('ID of the closed-ended Vault'),
  subscriptionDate: z.number().describe('End of Subscription, in seconds since the Ripple Epoch'),
  redemptionDate: z.number().describe('Start of Redemption, in seconds since the Ripple Epoch'),
  loanBrokerId: z.string().optional().describe('ID of the LoanBroker, set by the broker step'),
})

/**
 * Workflow output: the last step's output plus where the run was recorded
 */
export const lendingSetupResultSchema = vaultSchema.extend({
  loanBrokerId: z.string().describe('ID of the LoanBroker'),
  recordId: z.string().describe('Id of the saved record, usable with the get-flow-records tool'),
  recordPath: z.string().describe('Path of the saved record file'),
})
