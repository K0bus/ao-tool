<template>
  <div class="min-h-screen flex bg-surface-950">
    <!-- Sidebar -->
    <aside class="w-56 shrink-0 border-r border-surface-700 flex flex-col bg-surface-900">
      <!-- Logo -->
      <div class="h-14 flex items-center px-4 border-b border-surface-700">
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-primary-600 flex items-center justify-center">
            <span class="text-xs font-black text-white">AO</span>
          </div>
          <span class="text-sm font-bold text-white">Albion Tool</span>
        </NuxtLink>
        <span class="ml-auto text-xs text-primary-500 font-semibold">ADMIN</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-3 space-y-0.5 text-sm">
        <p class="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Overview</p>
        <AdminNavLink to="/admin" icon="grid" label="Dashboard" :exact="true" />

        <p class="px-3 py-2 mt-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Users</p>
        <AdminNavLink to="/admin/users" icon="users" label="Manage Users" />

        <p class="px-3 py-2 mt-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Data</p>
        <AdminNavLink to="/admin/data/imports" icon="download" label="Imports" />
        <AdminNavLink to="/admin/data/market" icon="chart" label="Market Prices" />
        <AdminNavLink to="/admin/data/icons" icon="image" label="Icons Sync" />
        <AdminNavLink to="/admin/data/system" icon="settings" label="System Config" />
      </nav>

      <!-- User info bottom -->
      <div class="p-3 border-t border-surface-700">
        <div class="flex items-center gap-2 px-3 py-2">
          <div class="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-white">
            {{ auth.user.value?.username?.[0]?.toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-white truncate">{{ auth.user.value?.username }}</p>
            <p class="text-xs text-gray-500">{{ auth.user.value?.role }}</p>
          </div>
          <button class="text-gray-500 hover:text-gray-300 transition-colors" title="Logout" @click="auth.logout()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-14 border-b border-surface-700 flex items-center px-6 bg-surface-900/50">
        <slot name="header">
          <h1 class="text-sm font-semibold text-white">Admin Panel</h1>
        </slot>
      </header>
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuth()
</script>
