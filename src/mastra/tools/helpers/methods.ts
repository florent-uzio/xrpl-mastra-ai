import { ToolExecutionContext } from '@mastra/core'
import { Request } from 'xrpl'
import { disconnectXrplClient, getXrplClient } from '../../../helpers'

type ExecuteMethodProps = {
  network: string
  request: Request
  logMessage: string
  mastra?: ToolExecutionContext['mastra']
}

/**
 * Shared utility function to execute XRPL account method requests
 * This reduces code duplication across all account tools
 *
 * @param network - The network to use
 * @param request - The request options
 * @param logMessage - The message to log for debugging
 * @param mastra - The Mastra instance for logging
 * @returns The XRPL response
 */
export const executeMethod = async <R extends Request>({
  network,
  request,
  logMessage,
  mastra,
}: ExecuteMethodProps) => {
  // Get or create an XRPL client instance for the specified network
  // This handles singleton pattern and connection management
  const client = await getXrplClient(network)

  // Get the logger instance from Mastra for structured logging
  const logger = mastra?.getLogger()

  // Log the account method request with network URL and request options
  // This helps with debugging and monitoring request patterns
  logger?.info(logMessage, { url: client.url, opts: JSON.stringify(request) })

  // Execute the specified command on the XRPL network
  // This retrieves the requested account data
  const response = await client.request(request)

  // Clean up: Disconnect the XRPL client to free up network resources
  // This is important for resource management and preventing connection leaks
  await disconnectXrplClient(network)

  // Return the response to the user
  return response
}
