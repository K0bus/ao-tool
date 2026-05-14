import { getInstallationStatus } from '~/server/utils/install'

export default defineEventHandler(async () => {
  return { data: await getInstallationStatus() }
})
