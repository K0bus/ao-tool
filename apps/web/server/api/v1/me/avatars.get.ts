import { promises as fs } from 'node:fs'
import path from 'node:path'
import { requireAuth } from '~/server/utils/guards'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const avatarsDir = path.resolve(process.cwd(), 'public/game_assets/gui/avatars')
  
  try {
    const files = await fs.readdir(avatarsDir, { withFileTypes: true })
    
    const avatars = files
      .filter(f => f.isFile())
      .map(f => f.name)
      .filter(name => {
        const ext = path.extname(name).toLowerCase()
        const isImage = ['.png', '.webp', '.jpg', '.jpeg'].includes(ext)
        const isNotRing = !name.toUpperCase().includes('RING')
        const hasAvatar = name.toUpperCase().includes('AVATAR')
        return isImage && isNotRing && hasAvatar
      })
      .sort((a, b) => a.localeCompare(b))

    return {
      data: avatars
    }
  } catch (err) {
    console.error('Error reading avatars directory:', err)
    return {
      data: []
    }
  }
})
