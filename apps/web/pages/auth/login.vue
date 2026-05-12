<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-bold text-white">Welcome back</h1>
      <p class="text-sm text-gray-400 mt-1">Sign in to your account</p>
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label class="label" for="email">Email or Username</label>
        <input
          id="email"
          v-model="form.email"
          type="text"
          class="input"
          placeholder="you@example.com or your username"
          autocomplete="username"
          required
        />
      </div>

      <div>
        <label class="label" for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          class="input"
          placeholder="••••••••"
          autocomplete="current-password"
          required
        />
      </div>

      <div class="flex justify-end">
        <NuxtLink to="/auth/forgot-password" class="text-xs text-primary-400 hover:text-primary-300">
          Forgot password?
        </NuxtLink>
      </div>

      <div
        v-if="error"
        class="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2"
      >
        {{ error }}
      </div>

      <button
        type="submit"
        class="btn-primary w-full"
        :disabled="loading"
      >
        <span v-if="loading">Signing in...</span>
        <span v-else>Sign In</span>
      </button>
    </form>

    <p class="text-center text-sm text-gray-500 mt-6">
      No account?
      <NuxtLink to="/auth/register" class="text-primary-400 hover:text-primary-300 font-medium">
        Sign up
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const auth = useAuth()

const form = reactive({ email: '', password: '' })
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
  error.value = null
  loading.value = true

  const result = await auth.login(form.email, form.password)

  if (!result.success) {
    error.value = result.error
    loading.value = false
    return
  }

  const redirect = route.query.redirect as string | undefined
  await navigateTo(redirect ?? '/')
}
</script>
