import { z } from 'zod'
import { xrplAddressSchema } from '../../../../helpers'
import { xrplCommonFieldsSchema } from '../shared/common-fields'

/**
 * DelegateSet-specific fields schema
 * Reference: https://xrpl.org/docs/references/protocol/transactions/types/delegateset#delegateset-fields
 */
export const xrplDelegateSetFieldsSchema = z.object({
  Authorize: xrplAddressSchema.describe(
    'The delegate account (r-address) being granted permissions to send transactions on behalf of Account. Must differ from Account.',
  ),
  Permissions: z
    .array(
      z.object({
        Permission: z.object({
          PermissionValue: z
            .string()
            .describe(
              'Name of a delegable permission. Granular permissions: TrustlineAuthorize, TrustlineFreeze, TrustlineUnfreeze, AccountDomainSet, AccountEmailHashSet, AccountMessageKeySet, AccountTransferRateSet, AccountTickSizeSet, PaymentMint, PaymentBurn, MPTokenIssuanceLock, MPTokenIssuanceUnlock. Or a delegable transaction type name (e.g. Payment, TrustSet, OfferCreate). Non-delegable: AccountSet, SetRegularKey, SignerListSet, DelegateSet, AccountDelete.',
            ),
        }),
      }),
    )
    .max(10)
    .describe(
      'Array of up to 10 permissions to grant to the delegate. Replaces any existing permissions; an empty array deletes the Delegate ledger entry. No duplicates.',
    ),
})

/**
 * Complete DelegateSet transaction schema (requires the PermissionDelegation amendment)
 */
export const xrplDelegateSetSchema = xrplCommonFieldsSchema
  .merge(xrplDelegateSetFieldsSchema)
  .extend({ TransactionType: z.literal('DelegateSet') })

export type XrplDelegateSetFields = z.infer<typeof xrplDelegateSetFieldsSchema>
export type XrplDelegateSet = z.infer<typeof xrplDelegateSetSchema>
