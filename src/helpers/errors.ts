/** A readable message for any thrown value: the crypto layer and the ledger can throw plain objects. */
export const errorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return typeof error === 'string' ? error : (JSON.stringify(error) ?? String(error))
}

/** Runs work and rethrows anything that is not an Error as one, so it never shows as [object Object]. */
export const withReadableErrors = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await work()
  } catch (error) {
    throw error instanceof Error ? error : new Error(errorMessage(error))
  }
}
