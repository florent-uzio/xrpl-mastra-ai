import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Wallet } from 'xrpl'
import { getProjectRoot } from './storage'

/**
 * Persistent records of what a flow (workflow run) created on a test network: wallets, token IDs, tx hashes.
 * One JSON file per run in `<records dir>/<flow>/<id>.json`. The folder is git-ignored. Only use with testnet/devnet,
 * because the records contain wallet seeds.
 */

export type FlowRecord = {
  id: string
  flow: string
  network: string
  createdAt: string
  data: Record<string, unknown>
}

/** `XRPL_RECORDS_DIR` if set, otherwise `<project root>/records`. */
export const getRecordsDir = () =>
  process.env.XRPL_RECORDS_DIR ? path.resolve(process.env.XRPL_RECORDS_DIR) : path.join(getProjectRoot(), 'records')

/** The address and seed of a wallet: enough to use it again later. */
export const toWalletRecord = (wallet: Wallet) => ({ address: wallet.classicAddress, seed: wallet.seed })

export const saveFlowRecord = async (params: {
  flow: string
  network: string
  data: Record<string, unknown>
}): Promise<{ record: FlowRecord; path: string }> => {
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

/** Every record, newest first, optionally restricted to one flow. */
export const listFlowRecords = async (flow?: string): Promise<FlowRecord[]> => {
  const root = getRecordsDir()
  const flows = flow ? [flow] : await readdir(root).catch(() => [])

  const records: FlowRecord[] = []
  for (const name of flows) {
    const files = await readdir(path.join(root, name)).catch(() => [])
    for (const file of files.filter(f => f.endsWith('.json'))) {
      records.push(JSON.parse(await readFile(path.join(root, name, file), 'utf8')))
    }
  }

  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
