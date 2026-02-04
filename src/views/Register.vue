<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { Gift, User, Lock, UserPlus, Loader2, AlertCircle, Hash } from 'lucide-vue-next'

const router = useRouter()
const username = ref('')
const password = ref('')
const inviteCode = ref('')
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
    loading.value = true
    error.value = ''
    try {
        await api.post('/register', {
            username: username.value,
            password: password.value,
            invite_code: inviteCode.value
        })
        router.push('/login')
    } catch (e: any) {
        error.value = e.response?.data?.message || '注册失败'
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
                        <h2 class="text-xl font-black">创建新账号</h2>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">加入 GiftFlow 交换惊喜</p>
                    </div>
                </div>
            </div>

            <div class="p-8 md:p-10">
                <form @submit.prevent="handleRegister" class="space-y-6">
                    <div class="space-y-2">
                        <label class="flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                            <User class="w-4 h-4 text-primary" />
                            用户名
                        </label>
                        <input v-model="username" type="text" class="input-field" placeholder="设置您的用户名" required />
                    </div>

                    <div class="space-y-2">
                        <label class="flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                            <Lock class="w-4 h-4 text-primary" />
                            密码
                        </label>
                        <input v-model="password" type="password" class="input-field" placeholder="设置您的密码" required />
                    </div>

                    <div class="space-y-2">
                        <label class="flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                            <Hash class="w-4 h-4 text-primary" />
                            邀请码
                        </label>
                        <input v-model="inviteCode" type="text" class="input-field" placeholder="输入群组邀请码" required />
                    </div>

                    <div v-if="error" class="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold">
                        <AlertCircle class="w-4 h-4 shrink-0" />
                        <span>{{ error }}</span>
                    </div>

                    <button type="submit" :disabled="loading" class="btn-primary w-full group">
                        <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
                        <template v-else>
                            <UserPlus class="w-5 h-5" />
                            <span>注册并开始</span>
                        </template>
                    </button>
                </form>

                <div class="mt-8 text-center border-t border-slate-50 pt-8">
                    <p class="text-sm text-slate-500 font-medium">
                        已有账号？
                        <router-link to="/login" class="text-primary font-black hover:underline ml-1">立即登录</router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

