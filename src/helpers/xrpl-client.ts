import { ToolExecutionContext } from '@mastra/core/tools'
import { Client } from 'xrpl'
import { normalizeNetworkUrl } from './networks'

// One long-lived client per network, shared by every tool call and workflow step.
// Clients are never disconnected after a call: concurrent calls share the socket, and
// xrpl.js reconnects on its own (heartbeat + backoff) if the connection drops.
// Keyed by the normalised URL, so "wss://x" and "wss://x/" share one socket.
const clientInstances = new Map<string, Client>()

export const getXrplClient = async (network: string, mastra: ToolExecutionContext['mastra']): Promise<Client> => {
  const logger = mastra?.getLogger()

  const key = normalizeNetworkUrl(network) ?? network
  let client = clientInstances.get(key)
  if (!client) {
    client = new Client(network)
    clientInstances.set(key, client)

    const clientUrl = client.url
    client.on('connected', () => logger?.info('Connected to XRP Ledger', { network, clientUrl }))
    client.on('disconnected', code => logger?.warn('Disconnected from XRP Ledger', { network, clientUrl, code }))
  }

  // No-op when already connected; waits for the pending connection when another call is connecting
  await client.connect()

  return client
}
