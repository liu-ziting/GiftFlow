<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')

const handleRegister = async () => {
  try {
    await api.post('/register', { username: username.value, password: password.value })
    router.push('/login')
  } catch (e: any) {
    error.value = e.response?.data?.message || '注册失败'
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-120px)]">
    <div class="window-card w-full max-w-md">
      <div class="window-header">
        <div class="dot bg-[#FF5F56]"></div>
        <div class="dot bg-[#FFBD2E]"></div>
        <div class="dot bg-[#27C93F]"></div>
        <span class="ml-2 text-xs font-mono text-slate-400">~/auth/register</span>
      </div>
      
      <div class="p-8">
        <h2 class="text-2xl mb-6">创建新账号</h2>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-xs font-mono text-slate-400 mb-1">$ username</label>
            <input v-model="username" type="text" class="terminal-input" placeholder="设置用户名" required>
          </div>
          <div>
            <label class="block text-xs font-mono text-slate-400 mb-1">$ password</label>
            <input v-model="password" type="password" class="terminal-input" placeholder="设置密码" required>
          </div>
          <p v-if="error" class="text-red-500 text-xs font-mono">! error: {{ error }}</p>
          <button type="submit" class="btn-primary w-full mt-4">注册账号</button>
        </form>
        <p class="mt-6 text-sm text-center text-slate-500">
          已有账号？ <router-link to="/login" class="text-primary hover:underline">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
