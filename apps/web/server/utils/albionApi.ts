const BASE = 'https://gameinfo-ams.albiononline.com/api/gameinfo'

export async function albionFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw createError({ statusCode: res.status, statusMessage: `Albion API: ${res.status}` })
  }
  return res.json() as Promise<T>
}
