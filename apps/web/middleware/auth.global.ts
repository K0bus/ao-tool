export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, isAdmin } = useAuth()

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
