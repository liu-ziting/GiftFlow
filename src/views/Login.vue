<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { Gift, User, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
    loading.value = true
    error.value = ''
    try {
        const res = await api.post('/login', { username: username.value, password: password.value })
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        router.push('/')
    } catch (e: any) {
        error.value = e.response?.data?.message || '登录失败'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="flex items-center justify-center min-h-[calc(100vh-160px)] px-6">
        <div class="gift-card w-full max-w-md">
            <div class="gift-card-header !py-6 !px-8">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Gift class="w-5 h-5" />
                    </div>
                    <div>
                        <h2 class="text-xl font-black">欢迎回来</h2>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">登录您的 GiftFlow 账号</p>
                    </div>
                </div>
            </div>

            <div class="p-8 md:p-10">
                <form @submit.prevent="handleLogin" class="space-y-6">
                    <div class="space-y-2">
                        <label class="flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                            <User class="w-4 h-4 text-primary" />
                            用户名
                        </label>
                        <input v-model="username" type="text" class="input-field" placeholder="您的用户名" required />
                    </div>

                    <div class="space-y-2">
                        <label class="flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                            <Lock class="w-4 h-4 text-primary" />
                            密码
                        </label>
                        <input v-model="password" type="password" class="input-field" placeholder="您的密码" required />
                    </div>

                    <div v-if="error" class="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold animate-shake">
                        <AlertCircle class="w-4 h-4 shrink-0" />
                        <span>{{ error }}</span>
                    </div>

                    <button type="submit" :disabled="loading" class="btn-primary w-full group">
                        <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
                        <template v-else>
                            <span>进入礼物中心</span>
                            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </template>
                    </button>
                </form>

                <div class="mt-8 text-center">
                    <p class="text-sm text-slate-500 font-medium">
                        还没有账号？
                        <router-link to="/register" class="text-primary font-black hover:underline ml-1">立即注册</router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

