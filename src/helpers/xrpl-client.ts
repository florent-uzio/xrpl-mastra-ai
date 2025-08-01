import { Client } from 'xrpl'
import { mastra } from '../mastra'

// Singleton pattern: store client instances
const clientInstances = new Map<string, Client>()

export const getXrplClient = async (network: string): Promise<Client> => {
  // Check if client already exists for this network
  if (clientInstances.has(network)) {
    const existingClient = clientInstances.get(network)!

    // Check if client is connected, if not connect it
    if (!existingClient.isConnected()) {
      // Log the connection
      const logger = mastra.getLogger()
      logger.info('Connecting to XRP Ledger', { network, clientUrl: existingClient.url })

      await existingClient.connect()

      // Log the connection
      logger.info('Connected to XRP Ledger', { network, clientUrl: existingClient.url })
    }

    return existingClient
  }

  // Create new client if it doesn't exist
  const client = new Client(network)
  clientInstances.set(network, client)

  // Log the connection
  const logger = mastra.getLogger()
  logger.info('Connecting to XRP Ledger', { network, clientUrl: client.url })

  await client.connect()

  // Log the connection
  logger.info('Connected to XRP Ledger', { network, clientUrl: client.url })

  return client
}

/**
 * Disconnect the client from the XRP Ledger
 * @param network - The network to disconnect from
 */
export const disconnectXrplClient = async (network: string) => {
  const client = clientInstances.get(network)
  if (client) {
    await client.disconnect()

    // Log the disconnection
    const logger = mastra.getLogger()
    logger.info('Disconnected from XRP Ledger', { network, clientUrl: client.url })

    // Delete the client from the instances
    clientInstances.delete(network)
  }
}
