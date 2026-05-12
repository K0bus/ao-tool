import { computed, ref, watch, toValue, type MaybeRefOrGetter } from 'vue'
import { buildAoItemImageUrls } from '~/utils/aoRender'

/** Tentatives par URL (CDN parfois lent ou erreur transitoire) avant fallback suivant */
const MAX_ATTEMPTS_PER_URL = 3
const PLACEHOLDER_SRC = '/images/placeholder-item.svg'

function urlsEquivalent(a: string, b: string): boolean {
  if (!a || !b) return false
  try {
    return new URL(a, 'https://render.albiononline.com').href === new URL(b, 'https://render.albiononline.com').href
  } catch {
    return a === b
  }
}

/**
 * Enchaîne les URLs render Albion (uniquename puis nom localisé) sur erreur de chargement image.
 * Réessaie la même URL avec un paramètre de cache-bust si le CDN répond mal / lent à démarrer,
 * et ignore les erreurs « obsolètes » quand le navigateur annule une requête après changement de src.
 */
export function useAoItemImage(
  uniqueName: MaybeRefOrGetter<string>,
  displayName?: MaybeRefOrGetter<string | null | undefined>,
  locale: MaybeRefOrGetter<string> = 'fr',
  primaryParams?: MaybeRefOrGetter<Record<string, string> | undefined>,
) {
  const urls = computed(() =>
    buildAoItemImageUrls({
      uniqueName: toValue(uniqueName),
      displayName: displayName !== undefined ? toValue(displayName) : undefined,
      locale: toValue(locale),
      primaryParams: primaryParams !== undefined ? toValue(primaryParams) : undefined,
    }),
  )

  const urlIndex = ref(0)
  const attempt = ref(1)
  const failed = ref(false)

  watch(urls, () => {
    urlIndex.value = 0
    attempt.value = 1
    failed.value = false
  })

  watch(urlIndex, () => {
    attempt.value = 1
  })

  const src = computed(() => {
    if (failed.value) return PLACEHOLDER_SRC

    const base = urls.value[urlIndex.value] ?? urls.value[0] ?? ''
    if (!base) return PLACEHOLDER_SRC
    if (attempt.value <= 1) return base
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}_=${attempt.value}`
  })

  function onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement | null
    if (!img) return

    const expected = src.value
    const actual = img.currentSrc || img.src
    if (urlsEquivalent(actual, PLACEHOLDER_SRC)) {
      failed.value = true
      return
    }
    if (actual && expected && !urlsEquivalent(actual, expected)) return

    if (attempt.value < MAX_ATTEMPTS_PER_URL) {
      attempt.value++
      return
    }

    attempt.value = 1
    if (urlIndex.value < urls.value.length - 1) {
      urlIndex.value++
    } else {
      failed.value = true
    }
  }

  return { src, failed, onImgError, urls }
}
