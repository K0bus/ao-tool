export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, isAdmin } = useAuth()
  const installState = useState<{
    installed: boolean
    hasAdmin: boolean
    hasSystemConfig: boolean
  } | null>('install.status', () => null)
  const apiFetch = useRequestFetch()

  if (!installState.value) {
    try {
      const res = await apiFetch<{
        data: {
          installed: boolean
          hasAdmin: boolean
          hasSystemConfig: boolean
        }
      }>('/api/v1/install/status')
      installState.value = res.data
    } catch {
      installState.value = {
        installed: true,
        hasAdmin: true,
        hasSystemConfig: true,
      }
    }
  }

  const isInstalled = installState.value?.installed !== false

  if (!isInstalled) {
    if (to.path !== '/install') {
      return navigateTo('/install')
    }
    return
  }

  if (to.path === '/install') {
    return navigateTo(isAuthenticated.value && isAdmin.value ? '/admin' : '/')
  }

  // Routes publiques
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/reset-password']
  if (publicRoutes.includes(to.path)) return

  // Routes items — accessibles sans compte
  if (to.path.startsWith('/items')) return

  // Routes admin
  if (to.path.startsWith('/admin')) {
    if (!isAuthenticated.value) {
      return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
    if (!isAdmin.value) {
      return navigateTo('/')
    }
    return
  }

  // Toutes les autres routes nécessitent d'être connecté
  if (!isAuthenticated.value) {
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
