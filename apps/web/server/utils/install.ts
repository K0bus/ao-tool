import { prisma } from './prisma'
import {
  DEFAULT_SYSTEM_CONFIGS,
  ensureBootstrapData,
} from '@albion-tool/database'

const REQUIRED_SYSTEM_CONFIG_KEYS = ['features', 'search'] as const

export type InstallationStatus = {
  installed: boolean
  hasAdmin: boolean
  hasSystemConfig: boolean
}

export function getDefaultSystemConfigs() {
  return DEFAULT_SYSTEM_CONFIGS
}

export async function getInstallationStatus(): Promise<InstallationStatus> {
  const [adminCount, configCount] = await Promise.all([
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.systemConfig.count({
      where: { key: { in: [...REQUIRED_SYSTEM_CONFIG_KEYS] } },
    }),
  ])

  const hasAdmin = adminCount > 0
  const hasSystemConfig = configCount === REQUIRED_SYSTEM_CONFIG_KEYS.length

  return {
    installed: hasAdmin && hasSystemConfig,
    hasAdmin,
    hasSystemConfig,
  }
}

export { ensureBootstrapData }
