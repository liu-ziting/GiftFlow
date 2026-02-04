<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

const form = ref({
  real_name: '',
  phone: '',
  address: ''
})
const loading = ref(true)
const saving = ref(false)
const message = ref('')

const fetchProfile = async () => {
  try {
    const res = await api.get('/profile')
    form.value = {
      real_name: res.data.real_name || '',
      phone: res.data.phone || '',
      address: res.data.address || ''
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  message.value = ''
  try {
    await api.post('/profile', form.value)
    message.value = '保存成功！'
  } catch (e) {
    message.value = '保存失败，请重试'
  } finally {
    saving.value = false
  }
}

onMounted(fetchProfile)
</script>

<template>
  <div class="max-w-2xl mx-auto py-12 px-4">
    <div class="window-card">
      <div class="window-header">
        <div class="dot bg-[#FF5F56]"></div>
        <div class="dot bg-[#FFBD2E]"></div>
        <div class="dot bg-[#27C93F]"></div>
        <span class="ml-2 text-xs font-mono text-slate-400">~/user/profile</span>
      </div>
      
      <div class="p-8">
        <h2 class="text-2xl mb-2">收货信息</h2>
        <p class="text-sm text-slate-400 mb-8 font-mono">> 请务必填写正确的地址，以免无法收到礼物。</p>
        
        <div v-if="loading" class="text-center py-12 font-mono text-slate-400 animate-pulse">
          $ loading_profile...
        </div>
        
        <form v-else @submit.prevent="handleSave" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-mono text-slate-400 mb-1">$ real_name</label>
              <input v-model="form.real_name" type="text" class="terminal-input" placeholder="收货人姓名" required>
            </div>
            <div>
              <label class="block text-xs font-mono text-slate-400 mb-1">$ phone</label>
              <input v-model="form.phone" type="text" class="terminal-input" placeholder="联系电话" required>
            </div>
          </div>
          <div>
            <label class="block text-xs font-mono text-slate-400 mb-1">$ detailed_address</label>
            <textarea v-model="form.address" rows="3" class="terminal-input py-3" placeholder="省、市、区、街道及详细地址" required></textarea>
          </div>
          
          <div class="flex items-center justify-between pt-4">
            <span v-if="message" class="text-sm font-mono" :class="message.includes('失败') ? 'text-red-500' : 'text-green-500'">
              {{ message.includes('失败') ? '!' : '>' }} {{ message }}
            </span>
            <div v-else></div>
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? '保存中...' : '保存信息' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
