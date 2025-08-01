import { Client } from 'xrpl'

// Singleton pattern: store client instances
const clientInstances = new Map<string, Client>()

export const getXrplClient = async (network: string): Promise<Client> => {
  // Check if client already exists for this network
  if (clientInstances.has(network)) {
    const existingClient = clientInstances.get(network)!

    // Check if client is connected, if not connect it
    if (!existingClient.isConnected()) {
      await existingClient.connect()
    }

    return existingClient
  }

  // Create new client if it doesn't exist
  const client = new Client(network)
  clientInstances.set(network, client)

  // Connect the new client
  await client.connect()

  return client
}
