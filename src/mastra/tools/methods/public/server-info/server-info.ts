import { createTool } from '@mastra/core/tools'
import { ServerInfoRequest } from 'xrpl'
import { z } from 'zod'
import { executeMethod } from '../../shared'

export const getServerInfoTool = createTool({
  id: 'get-server-info',
  description: `Get XRP Ledger server information. This method asks the server for a human-readable version of various information about the rippled server being queried.

Request Parameters:
- counters: If true, return metrics about the job queue, ledger store, and API method activity (boolean, optional, default: false)

The response includes:
- info: Object containing server information with the following fields:
  - build_version: The version number of the running rippled server (string)
  - complete_ledgers: Range expression indicating ledger versions the server has in its database (string)
  - hostid: Hostname of the server (admin request) or RFC-1751 word based on node public key (string)
  - io_latency_ms: Amount of time spent waiting for I/O operations, in milliseconds (number)
  - jq_trans_overflow: Number of times server had over 250 transactions waiting to be processed (string)
  - last_close: Information about the last time the server closed a ledger (object)
    - converge_time_s: Time to reach consensus on most recently validated ledger, in seconds (number)
    - proposers: Number of trusted validators considered in consensus process (number)
  - load_factor: Multiplier to transaction cost the server is currently enforcing (number)
  - load_factor_local: Current multiplier to transaction cost based on load to this server (number, optional)
  - load_factor_net: Current multiplier to transaction cost being used by the rest of the network (number, optional)
  - network_id: Network identifier (number)
  - peer_disconnects: Number of peer disconnections (string)
  - peer_disconnects_resources: Number of peer disconnections due to resource limits (string)
  - peers: Number of connected peers (number)
  - ports: Array of port descriptors where server is listening (array)
    - port: Port number where server is listening (string/number)
    - protocol: List of protocols being served on this port (array of strings)
  - pubkey_node: Node public key (string)
  - server_state: String indicating server's participation in the network (string)
  - server_state_duration_us: Number of consecutive microseconds server has been in current state (number)
  - state_accounting: Map of server states with time spent in each (object)
    - *.duration_us: Number of microseconds server has spent in this state (string)
    - *.transitions: Number of times server has changed into this state (string)
  - time: Current time in UTC according to server's clock (string)
  - uptime: Number of consecutive seconds server has been operational (number)
  - validated_ledger: Information about the most recent fully-validated ledger (object, optional)
    - age: Time since ledger was closed, in seconds (number)
    - base_fee_xrp: Base fee in XRP (number)
    - hash: Unique hash for the ledger as hexadecimal (string)
    - reserve_base_xrp: Minimum XRP necessary for every account to keep in reserve (number)
    - reserve_inc_xrp: Amount of XRP added to account reserve for each object owned (number)
    - seq: Ledger index of the latest validated ledger (number)
  - validation_quorum: Minimum number of trusted validations required to validate a ledger (number)
  - amendment_blocked: If true, server is amendment blocked (boolean, optional)
  - closed_ledger: Information on most recently closed ledger not yet validated (object, optional)
  - counters: Performance metrics about RPC calls and JobQueue (object, optional, when counters=true)
  - current_activity: Items currently being run in job queue (object, optional)

Note: If closed_ledger field is present with a small seq value (less than 8 digits), it indicates the server does not currently have a copy of the validated ledger from the peer-to-peer network, possibly still syncing.`,
  inputSchema: z.object({
    network: z.string(),
    request: z.custom<ServerInfoRequest>(),
  }),
  execute: async ({ context, mastra }) => {
    // Extract network and request from the context
    const { network, request } = context

    // Use the shared utility function to execute the server_info command
    return await executeMethod({
      network,
      request: { ...request, command: 'server_info' },
      logMessage: 'Server info request',
      mastra,
    })
  },
})
