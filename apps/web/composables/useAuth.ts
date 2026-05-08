import type { AuthUser } from '@albion-tool/types'

interface ApiUser extends AuthUser {}

export const useAuth = () => {
  const user = useState<ApiUser | null>('auth.user', () => null)
  const loading = useState<boolean>('auth.loading', () => false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isModerator = computed(() => ['ADMIN', 'MODERATOR'].includes(user.value?.role ?? ''))

  async function fetchUser() {
    // useRequestFetch forward les cookies en SSR
    const apiFetch = useRequestFetch()
    try {
      const res = await apiFetch<{ data: ApiUser }>('/api/v1/auth/me')
      user.value = res.data
    } catch {
      user.value = null
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const res = await $fetch<{ data: ApiUser }>('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      user.value = res.data
      return { success: true as const }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Login failed'
      return { success: false as const, error: msg }
    } finally {
      loading.value = false
    }
  }

  async function register(username: string, email: string, password: string) {
    loading.value = true
    try {
      await $fetch('/api/v1/auth/register', {
        method: 'POST',
        body: { username, email, password },
      })
      return { success: true as const }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Registration failed'
      return { success: false as const, error: msg }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await $fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {})
    user.value = null
    await navigateTo('/auth/login')
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated,
    isAdmin,
    isModerator,
    fetchUser,
    login,
    register,
    logout,
  }
}
