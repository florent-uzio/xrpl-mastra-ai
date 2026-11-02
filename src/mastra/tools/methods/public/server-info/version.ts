import { z } from 'zod'
import { defineMethodTool } from '../../shared'

export const getVersionTool = defineMethodTool({
  id: 'get-version',
  command: 'version',
  description: `Get the range of API versions a rippled server supports: the lowest (first), the default (good) and the highest (last).`,
  request: z.object({}),
  result: {
    version: z
      .looseObject({
        first: z.string(),
        good: z.string(),
        last: z.string(),
      })
      .partial()
      .optional(),
  },
})
