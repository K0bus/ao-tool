export function formatFame(n: number): string {
  if (!n || isNaN(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString('fr-FR')
}

export function fameRatio(kills: number, deaths: number): string {
  if (deaths === 0) return kills > 0 ? '∞' : '—'
  return (kills / deaths).toFixed(2)
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

/** Parse the tier number from an item uniqueName like "T8_2H_POLEHAMMER" or "T7_HEAD@1" */
export function itemTier(type: string): number {
  const m = type.match(/^T(\d)/)
  return m ? parseInt(m[1]) : 0
}

/** Parse the enchantment level from "@0"..."@3" suffix. Returns 0 if none. */
export function itemEnchant(type: string): number {
  const m = type.match(/@(\d)$/)
  return m ? parseInt(m[1]) : 0
}

/** Format as "T8" or "T8.3" label */
export function itemTierLabel(type: string): string {
  const t = itemTier(type)
  const e = itemEnchant(type)
  if (!t) return '?'
  return e > 0 ? `T${t}.${e}` : `T${t}`
}

/** Approximate item power. Not exact (requires game data files) but close enough for display. */
export function calcItemPower(type: string, quality: number): number {
  const t = itemTier(type)
  const e = itemEnchant(type)
  if (!t) return 0
  const base = t * 100
  const enchBonus = e * 75
  const qualBonus = Math.round((quality - 1) * 12.5)
  return base + enchBonus + qualBonus
}

export const QUALITY_LABELS = ['', 'Normal', 'Good', 'Outstanding', 'Excellent', 'Masterpiece']
export const QUALITY_COLORS = ['', 'var(--text-3)', 'var(--q-good)', 'var(--q-outstanding)', 'var(--q-excellent)', 'var(--q-masterpiece)']
