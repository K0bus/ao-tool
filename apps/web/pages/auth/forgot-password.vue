<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-bold text-white">Forgot Password</h1>
      <p class="text-sm text-gray-400 mt-1">Enter your email to receive a reset link</p>
    </div>

    <form v-if="!success" class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label class="label" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="input"
          placeholder="you@example.com"
          autocomplete="email"
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
        {{ loading ? 'Sending...' : 'Send Reset Link' }}
      </button>
    </form>

    <div
      v-else
      class="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-md px-4 py-3"
    >
      If an account exists for that email, a reset link has been sent.
    </div>

    <p class="text-center text-sm text-gray-500 mt-6">
      Remember your password?
      <NuxtLink to="/auth/login" class="text-primary-400 hover:text-primary-300 font-medium">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const email = ref('')
const error = ref<string | null>(null)
const success = ref(false)
const loading = ref(false)

async function handleSubmit() {
  error.value = null
  loading.value = true
  try {
    await $fetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })
    success.value = true
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
