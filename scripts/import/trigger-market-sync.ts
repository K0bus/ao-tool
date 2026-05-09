import { runMarketSync } from './run-market-sync'
import { prisma } from '@albion-tool/database'
import { closeAllConnections } from '@albion-tool/queue'

async function main() {
  try {
    const result = await runMarketSync()
    console.log('Market sync triggered successfully:')
    console.table(result)
  } catch (error) {
    console.error('Failed to trigger market sync:', error)
    process.exit(1)
  } finally {
    await closeAllConnections()
    await prisma.$disconnect()
    process.exit(0)
  }
}

main()
