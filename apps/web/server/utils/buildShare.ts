import { randomBytes } from 'crypto'
import type { GuestBuildPayload } from '@albion-tool/types'

// Génère un shareCode unique (~10 chars, URL-safe)
export function generateShareCode(): string {
  return randomBytes(8).toString('base64url').slice(0, 10)
}

// Encode un build invité en base64url (pas de DB nécessaire)
export function encodeGuestBuild(payload: GuestBuildPayload): string {
  const json = JSON.stringify(payload)
  return Buffer.from(json, 'utf8').toString('base64url')
}

// Décode un build invité depuis base64url — retourne null si invalide
export function decodeGuestBuild(encoded: string): GuestBuildPayload | null {
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf8')
    const payload = JSON.parse(json) as GuestBuildPayload
    if (payload.v !== 1) return null
    return payload
  } catch {
    return null
  }
}

// Payload → URL de partage guest (ex: /builds/s/AbCdEfGhIj...)
export function buildGuestShareUrl(baseUrl: string, payload: GuestBuildPayload): string {
  return `${baseUrl}/builds/s/${encodeGuestBuild(payload)}`
}
