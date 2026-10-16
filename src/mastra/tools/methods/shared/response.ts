import { z } from 'zod'

/**
 * Builds the output schema of a read-only XRPL method.
 * Every field is optional and extra fields are kept, so the schema documents the
 * useful parts of the response without ever rejecting a valid server answer
 * (rippled and Clio differ slightly).
 */
export const xrplMethodResponse = <T extends z.ZodRawShape>(resultShape: T) =>
  z.looseObject({
    id: z.union([z.string(), z.number()]).optional(),
    type: z.string().optional().describe('Always "response"'),
    result: z.looseObject({
      ledger_index: z.number().optional().describe('Ledger the data comes from'),
      ledger_current_index: z.number().optional().describe('Current (open) ledger the data comes from'),
      validated: z.boolean().optional().describe('true if the data is from a validated (final) ledger'),
      marker: z.unknown().optional().describe('Present if more results exist: pass it back as request.marker'),
      ...resultShape,
    }),
  })
