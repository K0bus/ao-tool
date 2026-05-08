<template>
  <div class="min-h-screen flex flex-col bg-surface-950">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 border-b border-surface-700 bg-surface-950/90 backdrop-blur-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-14 items-center justify-between gap-4">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2 shrink-0">
            <div class="w-7 h-7 rounded bg-primary-600 flex items-center justify-center">
              <span class="text-xs font-black text-white">AO</span>
            </div>
            <span class="font-bold text-white text-sm hidden sm:block">Albion Tool</span>
          </NuxtLink>

          <!-- Nav links -->
          <nav class="hidden md:flex items-center gap-1 text-sm">
            <NuxtLink
              to="/items"
              class="px-3 py-1.5 rounded text-gray-400 hover:text-white hover:bg-surface-800 transition-colors"
              active-class="text-white bg-surface-800"
            >
              Items
            </NuxtLink>
          </nav>

          <!-- Right side -->
          <div class="flex items-center gap-2 ml-auto">
            <template v-if="auth.isAuthenticated.value">
              <span class="text-sm text-gray-400 hidden sm:block">
                {{ auth.user.value?.username }}
              </span>
              <NuxtLink
                v-if="auth.isAdmin.value"
                to="/admin"
                class="btn-ghost text-xs px-3 py-1.5"
              >
                Admin
              </NuxtLink>
              <button class="btn-ghost text-xs px-3 py-1.5" @click="auth.logout()">
                Logout
              </button>
            </template>
            <template v-else>
              <NuxtLink to="/auth/login" class="btn-ghost text-xs px-3 py-1.5">
                Login
              </NuxtLink>
              <NuxtLink to="/auth/register" class="btn-primary text-xs px-3 py-1.5">
                Sign Up
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-surface-800 py-4 text-center text-xs text-gray-600">
      Albion Tool — not affiliated with Sandbox Interactive
    </footer>
  </div>
</template>

<script setup lang="ts">
const auth = useAuth()
</script>
