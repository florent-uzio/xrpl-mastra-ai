import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { Wallet } from 'xrpl'
import { isTestNetwork } from './networks'
import { getProjectRoot } from './storage'

/**
 * Persistent records of what a flow (workflow run) created on a test network: wallets, token IDs, tx hashes.
 * One JSON file per run in `<records dir>/<flow>/<id>.json`. The folder is git-ignored. Secrets (seeds, private
 * keys) are only accepted for test networks; on any other network a record may hold addresses and public keys only.
 */

export type FlowRecord = {
  id: string
  flow: string
  network: string
  createdAt: string
  data: Record<string, unknown>
}

/** Expands a leading `~` to the home directory, since MCP clients pass env values without going through a shell. */
const expandHome = (p: string) => (p === '~' || p.startsWith('~/') ? path.join(homedir(), p.slice(1)) : p)

/** `XRPL_RECORDS_DIR` if set (a leading `~` is expanded), otherwise `<project root>/records`. */
export const getRecordsDir = () =>
  process.env.XRPL_RECORDS_DIR
    ? path.resolve(expandHome(process.env.XRPL_RECORDS_DIR))
    : path.join(getProjectRoot(), 'records')

/** The address and seed of a wallet: plain JSON, enough to sign with it again later (Wallet.fromSeed). */
export type WalletRecord = { address: string; seed: string }

export const toWalletRecord = (wallet: Wallet): WalletRecord => {
  if (!wallet.seed) throw new Error(`Wallet ${wallet.classicAddress} has no seed`)
  return { address: wallet.classicAddress, seed: wallet.seed }
}

/** Flow names become folder names: letters, digits, "-" and "_" only, so a name can never leave the records folder. */
export const FLOW_NAME_PATTERN = /^[A-Za-z0-9_-]+$/

const assertFlowName = (flow: string) => {
  if (!FLOW_NAME_PATTERN.test(flow)) throw new Error(`Invalid flow name "${flow}": use letters, digits, "-" and "_"`)
}

const SECRET_KEY = /seed|private|secret/i

/** The path of every key that looks like a secret (seed, privateKey, secret, confidentialSeed, ...), at any depth. */
const secretKeys = (value: unknown, at = 'data'): string[] => {
  if (Array.isArray(value)) return value.flatMap((entry, i) => secretKeys(entry, `${at}[${i}]`))
  if (typeof value !== 'object' || value === null) return []
  return Object.entries(value).flatMap(([key, entry]) => [
    ...(SECRET_KEY.test(key) ? [`${at}.${key}`] : []),
    ...secretKeys(entry, `${at}.${key}`),
  ])
}

/**
 * Saves a record. `network` is the WebSocket URL used. Throws when the flow name is invalid, or when the data holds a
 * secret and the network is not a test network.
 */
export const saveFlowRecord = async (params: {
  flow: string
  network: string
  data: Record<string, unknown>
}): Promise<{ record: FlowRecord; path: string }> => {
  assertFlowName(params.flow)
  const secrets = secretKeys(params.data)
  if (secrets.length > 0 && !isTestNetwork(params.network)) {
    throw new Error(
      `Refusing to save ${secrets.join(', ')}: ${params.network} is not a known test network, so only addresses ` +
        `and public keys may be saved. On a test network, pass its WebSocket URL as network.`,
    )
  }

  const createdAt = new Date().toISOString()
  // ':' and '.' are not safe in file names on every OS
  const id = `${params.flow}-${createdAt.replace(/[:.]/g, '-')}`
  const record: FlowRecord = { id, flow: params.flow, network: params.network, createdAt, data: params.data }

  const dir = path.join(getRecordsDir(), params.flow)
  await mkdir(dir, { recursive: true })
  const filePath = path.join(dir, `${id}.json`)
  await writeFile(filePath, JSON.stringify(record, null, 2))

  return { record, path: filePath }
}

/** Every record, newest first, optionally restricted to one flow. Files that are not valid JSON are skipped. */
export const listFlowRecords = async (flow?: string): Promise<FlowRecord[]> => {
  if (flow !== undefined) assertFlowName(flow)
  const root = getRecordsDir()
  const flows = flow ? [flow] : (await readdir(root).catch(() => [])).filter(name => FLOW_NAME_PATTERN.test(name))

  const records: FlowRecord[] = []
  for (const name of flows) {
    const files = await readdir(path.join(root, name)).catch(() => [])
    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        records.push(JSON.parse(await readFile(path.join(root, name, file), 'utf8')))
      } catch {
        // A corrupt or half-written file must not hide every other record
      }
    }
  }

  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
