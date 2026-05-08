<template>
  <div>
    <div class="page-header flex items-center gap-4">
      <NuxtLink to="/admin/users" class="btn-ghost text-xs px-2 py-1">
        ← Users
      </NuxtLink>
      <div>
        <h1 class="page-title">{{ user?.username ?? 'User Detail' }}</h1>
        <p v-if="user" class="page-subtitle">{{ user.email }}</p>
      </div>
    </div>

    <div v-if="pending" class="animate-pulse space-y-4">
      <div class="card p-6 h-40" />
      <div class="card p-6 h-32" />
    </div>

    <div v-else-if="user" class="grid gap-4 lg:grid-cols-3">
      <!-- Main info -->
      <div class="lg:col-span-2 space-y-4">
        <div class="card p-5">
          <h2 class="text-sm font-semibold text-gray-300 mb-4">Account Information</h2>
          <dl class="space-y-3">
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">ID</dt>
              <dd class="text-gray-200 font-mono text-xs">{{ user.id }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Username</dt>
              <dd class="text-white font-medium">{{ user.username }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Email</dt>
              <dd class="text-gray-200">{{ user.email }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Email verified</dt>
              <dd>
                <span :class="user.emailVerified ? 'text-green-400' : 'text-red-400'">
                  {{ user.emailVerified ? 'Yes' : 'No' }}
                </span>
              </dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Last login</dt>
              <dd class="text-gray-200">{{ user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Last IP</dt>
              <dd class="text-gray-400 font-mono text-xs">{{ user.lastLoginIp ?? '—' }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Joined</dt>
              <dd class="text-gray-200">{{ formatDate(user.createdAt) }}</dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="text-gray-500">Active sessions</dt>
              <dd class="text-gray-200">{{ user._count?.sessions ?? 0 }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Actions sidebar -->
      <div class="space-y-4">
        <!-- Role -->
        <div class="card p-5">
          <h2 class="text-sm font-semibold text-gray-300 mb-3">Role</h2>
          <div class="space-y-2">
            <label
              v-for="role in ['USER', 'MODERATOR', 'ADMIN']"
              :key="role"
              class="flex items-center gap-2.5 p-2.5 rounded cursor-pointer hover:bg-surface-800 transition-colors"
              :class="{ 'bg-surface-700': form.role === role }"
            >
              <input v-model="form.role" type="radio" :value="role" class="text-primary-500" />
              <span class="text-sm text-gray-200">{{ role }}</span>
            </label>
          </div>
        </div>

        <!-- Status -->
        <div class="card p-5">
          <h2 class="text-sm font-semibold text-gray-300 mb-3">Status</h2>
          <div class="space-y-2">
            <label
              v-for="status in ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']"
              :key="status"
              class="flex items-center gap-2.5 p-2.5 rounded cursor-pointer hover:bg-surface-800 transition-colors"
              :class="{ 'bg-surface-700': form.status === status }"
            >
              <input v-model="form.status" type="radio" :value="status" class="text-primary-500" />
              <span class="text-sm text-gray-200">{{ status }}</span>
            </label>
          </div>
        </div>

        <!-- Save -->
        <div class="space-y-2">
          <button
            class="btn-primary w-full"
            :disabled="saving || !isDirty"
            @click="save"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>

          <div v-if="saved" class="text-xs text-green-400 text-center py-1">
            Changes saved successfully
          </div>

          <div
            v-if="saveError"
            class="text-xs text-red-400 bg-red-400/10 rounded px-3 py-2"
          >
            {{ saveError }}
          </div>
        </div>

        <!-- Danger zone -->
        <div class="card p-5 border-red-600/20">
          <h2 class="text-sm font-semibold text-red-400 mb-3">Danger Zone</h2>
          <button
            class="btn-danger w-full text-sm"
            @click="confirmDelete"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const route = useRoute()
const userId = route.params.id as string

interface UserDetail {
  id: string
  email: string
  username: string
  role: string
  status: string
  emailVerified: boolean
  lastLoginAt: string | null
  lastLoginIp: string | null
  createdAt: string
  updatedAt: string
  _count: { sessions: number; importJobs: number }
}

const { data, pending } = await useFetch<{ data: UserDetail }>(`/api/v1/admin/users/${userId}`)
const user = computed(() => data.value?.data ?? null)

const form = reactive({ role: '', status: '' })
const saving = ref(false)
const saved = ref(false)
const saveError = ref<string | null>(null)

watch(user, (v) => {
  if (v) {
    form.role = v.role
    form.status = v.status
  }
}, { immediate: true })

const isDirty = computed(() =>
  user.value && (form.role !== user.value.role || form.status !== user.value.status)
)

async function save() {
  if (!isDirty.value || !user.value) return
  saving.value = true
  saved.value = false
  saveError.value = null

  try {
    const updates: Record<string, string> = {}
    if (form.role !== user.value.role) updates.role = form.role
    if (form.status !== user.value.status) updates.status = form.status

    await $fetch(`/api/v1/admin/users/${userId}`, { method: 'PATCH', body: updates })
    saved.value = true
    setTimeout(() => (saved.value = false), 3000)
  } catch (err: any) {
    saveError.value = err?.data?.message ?? 'Save failed'
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!user.value) return
  if (!confirm(`Delete account "${user.value.username}"? This cannot be undone.`)) return

  await $fetch(`/api/v1/admin/users/${userId}`, { method: 'DELETE' })
  await navigateTo('/admin/users')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>
