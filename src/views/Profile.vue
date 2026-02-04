<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'
import { User, Phone, MapPin, Save, Loader2, CheckCircle2, PartyPopper } from 'lucide-vue-next'

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
        message.value = '信息已成功更新'
        setTimeout(() => (message.value = ''), 3000)
    } catch (e) {
        message.value = '更新失败，请重试'
    } finally {
        saving.value = false
    }
}

onMounted(fetchProfile)
</script>

<template>
    <div class="max-w-3xl mx-auto py-6 md:py-8">
        <div class="gift-card overflow-hidden">
            <div class="gift-card-header !py-6 !px-6 md:!px-8">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <User class="w-5 h-5" />
                    </div>
                    <div>
                        <h2 class="text-xl md:text-2xl font-black">收货信息</h2>
                        <p class="text-[10px] md:text-xs text-slate-400 font-medium mt-0.5">请确保信息准确，以便伙伴能准确寄送礼物</p>
                    </div>
                </div>
            </div>

            <div class="p-6 md:p-12">
                <div v-if="loading" class="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 class="w-8 h-8 text-primary/30 animate-spin" />
                    <p class="text-slate-400 font-bold text-xs uppercase tracking-widest">加载中...</p>
                </div>

                <form v-else @submit.prevent="handleSave" class="space-y-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-2">
                            <label class="flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                                <User class="w-4 h-4 text-primary" />
                                收货人姓名
                            </label>
                            <input v-model="form.real_name" type="text" class="input-field" placeholder="如何称呼您？" required />
                        </div>

                        <div class="space-y-2">
                            <label class="flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                                <Phone class="w-4 h-4 text-primary" />
                                联系电话
                            </label>
                            <input v-model="form.phone" type="text" class="input-field" placeholder="快递员联系您的号码" required />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
                            <MapPin class="w-4 h-4 text-primary" />
                            详细收货地址
                        </label>
                        <textarea v-model="form.address" rows="4" class="input-field py-4 resize-none" placeholder="省、市、区、街道及详细门牌号" required></textarea>
                    </div>

                    <div class="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-50">
                        <div class="flex items-center gap-2 transition-all" :class="message ? 'opacity-100' : 'opacity-0'">
                            <CheckCircle2 v-if="!message.includes('失败')" class="w-5 h-5 text-green-500" />
                            <span class="text-sm font-bold" :class="message.includes('失败') ? 'text-red-500' : 'text-green-600'">
                                {{ message }}
                            </span>
                        </div>

                        <button type="submit" :disabled="saving" class="btn-primary w-full md:w-auto min-w-[160px]">
                            <Loader2 v-if="saving" class="w-5 h-5 animate-spin" />
                            <Save v-else class="w-5 h-5" />
                            <span>{{ saving ? '正在保存...' : '保存修改' }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Tips -->
        <div class="mt-8 p-6 bg-secondary/5 border-2 border-secondary/10 rounded-3xl flex gap-4">
            <div class="w-10 h-10 bg-secondary/20 text-secondary-hover rounded-full flex items-center justify-center shrink-0">
                <PartyPopper class="w-5 h-5" />
            </div>
            <div class="space-y-1">
                <p class="font-black text-slate-800">温馨提示</p>
                <p class="text-sm text-slate-500 leading-relaxed">礼物交换是一个传递快乐的过程，请在收到匹配结果后 3 天内完成寄送！</p>
            </div>
        </div>
    </div>
</template>

