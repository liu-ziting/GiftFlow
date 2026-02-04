<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isLogged = ref(false)
const user = ref<any>(null)

const checkAuth = () => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
        isLogged.value = true
        user.value = JSON.parse(userData)
    } else {
        isLogged.value = false
        user.value = null
    }
}

const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    checkAuth()
    router.push('/login')
}

onMounted(checkAuth)

// Re-check auth when route changes or after login
watch(() => route.path, checkAuth)
</script>

<template>
    <div class="min-h-screen flex flex-col">
        <!-- Navbar -->
        <nav class="h-16 border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8">
            <router-link to="/" class="flex items-center gap-2">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">GF</div>
                <span class="text-xl font-bold tracking-tight">GiftFlow</span>
            </router-link>

            <div class="flex items-center gap-6">
                <template v-if="isLogged">
                    <router-link to="/" class="text-sm font-medium hover:text-primary transition-colors" :class="{ 'text-primary': route.path === '/' }">活动</router-link>
                    <router-link to="/profile" class="text-sm font-medium hover:text-primary transition-colors" :class="{ 'text-primary': route.path === '/profile' }"
                        >地址</router-link
                    >
                    <div class="h-4 w-[1px] bg-slate-200"></div>
                    <span class="text-sm font-mono text-slate-400">> {{ user?.username }}</span>
                    <button @click="handleLogout" class="text-sm text-slate-400 hover:text-red-500 transition-colors">Logout</button>
                </template>
                <template v-else-if="route.path !== '/login' && route.path !== '/register'">
                    <router-link to="/login" class="text-sm font-bold hover:text-primary transition-colors">Login</router-link>
                    <router-link to="/register" class="btn-primary py-1.5 px-4 text-sm">Register</router-link>
                </template>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="flex-1 container mx-auto px-4">
            <router-view></router-view>
        </main>

        <!-- Footer -->
        <footer class="py-12 text-center text-slate-300 text-xs font-mono">
            <div class="flex justify-center gap-4 mb-4">
                <span class="hover:text-slate-400 cursor-pointer">Terms</span>
                <span class="hover:text-slate-400 cursor-pointer">Privacy</span>
                <span class="hover:text-slate-400 cursor-pointer">GitHub</span>
            </div>
            &copy; 2026 GiftFlow. Built with Cloudflare D1 & Workers.
        </footer>
    </div>
</template>

