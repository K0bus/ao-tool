/** CDN officiel Albion pour les icônes items / sorts */
export const AO_RENDER_ITEM_BASE = 'https://render.albiononline.com/v1/item'

export function aoItemIconUrl(uniqueName: string): string {
  return `${AO_RENDER_ITEM_BASE}/${uniqueName}.png`
}

/**
 * URLs à essayer dans l’ordre : d’abord par uniquename (optionnellement ?quality=…),
 * puis par nom affiché localisé (ex. vanity).
 */
export function buildAoItemImageUrls(opts: {
  uniqueName: string
  displayName?: string | null
  locale?: string
  /** Query uniquement sur la première URL (ex. { quality: '5' }) */
  primaryParams?: Record<string, string>
}): string[] {
  const locale = opts.locale ?? 'fr'
  const q =
    opts.primaryParams && Object.keys(opts.primaryParams).length > 0
      ? `?${new URLSearchParams(opts.primaryParams).toString()}`
      : ''
  const primary = `${AO_RENDER_ITEM_BASE}/${opts.uniqueName}.png${q}`
  const urls = [primary]

  const label = opts.displayName?.trim()
  if (label) {
    const fallback = `${AO_RENDER_ITEM_BASE}/${encodeURIComponent(label)}.png?locale=${encodeURIComponent(locale)}`
    if (fallback !== primary) urls.push(fallback)
  }

  return urls
}

/**
 * Parse les tags de mise en forme Albion Online ([buff], [heal], etc.) en HTML stylé.
 */
export function parseAoDescription(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .replace(/\[buff\](.*?)\[\/buff\]/gi, '<span class="spell-buff">$1</span>')
    .replace(/\[heal\](.*?)\[\/heal\]/gi, '<span class="spell-heal">$1</span>')
    .replace(/\[dmg\](.*?)\[\/dmg\]/gi, '<span class="spell-dmg">$1</span>')
    .replace(/\[cc\](.*?)\[\/cc\]/gi, '<span class="spell-cc">$1</span>')
    .replace(/\[debuff\](.*?)\[\/debuff\]/gi, '<span class="spell-debuff">$1</span>')
    .replace(/\[other\](.*?)\[\/other\]/gi, '<span class="spell-other">$1</span>')
    .replace(/\[tab\/\]/gi, ' ')
    .replace(/\n/g, '<br>')
}
