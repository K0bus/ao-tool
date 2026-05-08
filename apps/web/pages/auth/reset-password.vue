<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-bold text-white">Reset Password</h1>
      <p class="text-sm text-gray-400 mt-1">Choose a new password for your account</p>
    </div>

    <!-- Token manquant -->
    <div v-if="!token" class="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-4 py-3">
      Invalid reset link. Please request a new one.
      <NuxtLink to="/auth/forgot-password" class="underline ml-1">Forgot password</NuxtLink>
    </div>

    <template v-else>
      <form v-if="!success" class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="label" for="password">New Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="input"
            placeholder="Min. 8 characters"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>

        <div>
          <label class="label" for="confirm">Confirm Password</label>
          <input
            id="confirm"
            v-model="form.confirm"
            type="password"
            class="input"
            placeholder="Repeat your password"
            autocomplete="new-password"
            required
          />
        </div>

        <div
          v-if="error"
          class="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2"
        >
          {{ error }}
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <div
        v-else
        class="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-md px-4 py-3"
      >
        Password reset successfully.
        <NuxtLink to="/auth/login" class="underline ml-1 font-medium">Sign in</NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const token = computed(() => route.query.token as string | undefined)

const form = reactive({ password: '', confirm: '' })
const error = ref<string | null>(null)
const success = ref(false)
const loading = ref(false)

async function handleSubmit() {
  error.value = null

  if (form.password !== form.confirm) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, password: form.password },
    })
    success.value = true
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? 'Reset failed. The link may have expired.'
  } finally {
    loading.value = false
  }
}
</script>
