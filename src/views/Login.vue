<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  try {
    const res = await api.post('/login', { username: username.value, password: password.value })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    router.push('/')
  } catch (e: any) {
    error.value = e.response?.data?.message || '登录失败'
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
        <span class="ml-2 text-xs font-mono text-slate-400">~/auth/login</span>
      </div>
      
      <div class="p-8">
        <h2 class="text-2xl mb-6">欢迎回来</h2>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-mono text-slate-400 mb-1">$ username</label>
            <input v-model="username" type="text" class="terminal-input" placeholder="输入用户名" required>
          </div>
          <div>
            <label class="block text-xs font-mono text-slate-400 mb-1">$ password</label>
            <input v-model="password" type="password" class="terminal-input" placeholder="输入密码" required>
          </div>
          <p v-if="error" class="text-red-500 text-xs font-mono">! error: {{ error }}</p>
          <button type="submit" class="btn-primary w-full mt-4">登录系统</button>
        </form>
        <p class="mt-6 text-sm text-center text-slate-500">
          还没有账号？ <router-link to="/register" class="text-primary hover:underline">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>
