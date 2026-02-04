<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Gift, User, LogOut, LayoutDashboard } from 'lucide-vue-next'
import { useModal, getIcon, getIconClass } from './useModal'

const { isVisible, options, confirm, cancel } = useModal()
const router = useRouter()
const route = useRoute()
const isLogged = ref(false)
const userData = ref<any>(null)

const checkAuth = () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
        isLogged.value = true
        userData.value = JSON.parse(storedUser)
    } else {
        isLogged.value = false
        userData.value = null
    }
}

const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    checkAuth()
    router.push('/login')
}

onMounted(checkAuth)
watch(() => route.path, checkAuth)
</script>

<template>
    <div class="min-h-screen flex flex-col">
        <!-- Navbar -->
        <nav class="h-20 bg-white/70 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-4 md:px-12 border-b border-primary/5">
            <router-link to="/" class="flex items-center gap-3 group shrink-0">
                <div class="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform group-hover:rotate-12">
                    <Gift class="w-6 h-6" />
                </div>
                <span class="text-2xl font-black tracking-tighter hidden sm:block bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">GiftFlow</span>
            </router-link>

            <div class="flex items-center gap-2 md:gap-4 p-1.5 bg-slate-100/50 rounded-2xl">
                <template v-if="isLogged">
                    <router-link to="/" class="nav-link" :class="{ 'nav-link-active': route.path === '/' }">
                        <LayoutDashboard class="w-4 h-4" />
                        <span class="hidden md:inline">活动中心</span>
                    </router-link>
                    <router-link to="/profile" class="nav-link" :class="{ 'nav-link-active': route.path === '/profile' }">
                        <User class="w-4 h-4" />
                        <span class="hidden md:inline">收货信息</span>
                    </router-link>
                    <button @click="handleLogout" class="nav-link text-slate-400 hover:text-red-500 hover:bg-red-50">
                        <LogOut class="w-4 h-4" />
                    </button>
                </template>
                <template v-else-if="route.path !== '/login' && route.path !== '/register'">
                    <router-link to="/login" class="nav-link">登录</router-link>
                    <router-link to="/register" class="btn-primary !px-5 !py-2 !rounded-xl !text-sm">注册</router-link>
                </template>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="flex-1 max-w-7xl mx-auto w-full px-4 md:px-12 py-6 md:py-8">
            <router-view></router-view>
        </main>

        <!-- Footer -->
        <footer class="py-12 text-center text-slate-400 text-sm font-medium">
            <div class="flex items-center justify-center gap-2 mb-2">
                <div class="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
                <p>让礼物传递惊喜与温暖</p>
                <div class="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
            </div>
            <p class="opacity-50">&copy; 2026 GiftFlow. Built with ❤️ for Gifting.</p>
        </footer>

        <!-- Global Modal -->
        <div v-if="isVisible" class="modal-overlay" @click.self="cancel">
            <div class="modal-content">
                <div class="modal-header">
                    <div :class="['w-16 h-16 rounded-3xl flex items-center justify-center', getIconClass(options.type)]">
                        <component :is="getIcon(options.type)" class="w-8 h-8" />
                    </div>
                    <h3 class="text-2xl font-black text-slate-900">{{ options.title }}</h3>
                </div>
                <div class="modal-body">
                    {{ options.message }}
                </div>
                <div class="modal-footer">
                    <button v-if="options.type === 'confirm'" @click="cancel" class="btn-secondary flex-1">
                        {{ options.cancelText }}
                    </button>
                    <button @click="confirm" :class="['btn-primary flex-1', options.type === 'error' ? '!bg-red-500 !shadow-red-200' : '']">
                        {{ options.confirmText }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

