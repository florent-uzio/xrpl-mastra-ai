/**
 * Throws unless the confidential key derived from the seed is the one registered on the ledger for this role.
 * With required false, a missing registration passes (a first convert registers the key).
 */
export const assertKeyMatches = (params: {
  publicKey: string
  registeredKey: string | undefined
  role: 'holder' | 'issuer' | 'auditor'
  required: boolean
  owner: string
}) => {
  const { publicKey, registeredKey, role, required, owner } = params
  if (!registeredKey) {
    if (required) throw new Error(`No ${role} encryption key is registered for ${owner}`)
    return
  }
  if (registeredKey !== publicKey) {
    throw new Error(`The confidentialSeed does not match the ${role} encryption key registered on the ledger`)
  }
}
