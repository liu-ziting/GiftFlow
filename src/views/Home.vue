<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'
import { Copy, Check } from 'lucide-vue-next'

const status = ref('joining')
const participantCount = ref(0)
const myGift = ref<any>(null)
const user = JSON.parse(localStorage.getItem('user') || '{}')
const loading = ref(true)
const joining = ref(false)
const drawing = ref(false)
const copied = ref(false)

const fetchData = async () => {
    try {
        const [statusRes, giftRes] = await Promise.all([api.get('/status'), api.get('/my-gift')])
        status.value = statusRes.data.status
        participantCount.value = statusRes.data.participantCount
        myGift.value = giftRes.data.result
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const handleJoin = async () => {
    joining.value = true
    try {
        await api.post('/join')
        await fetchData()
        alert('成功参与活动！')
    } catch (e: any) {
        alert(e.response?.data?.message || '参与失败，请先在个人中心填写地址')
    } finally {
        joining.value = false
    }
}

const handleDraw = async () => {
    if (!confirm('确定要开始抽奖吗？此操作不可逆，将立即为所有人分配礼物对象。')) return
    drawing.value = true
    try {
        await api.post('/admin/draw')
        await fetchData()
        alert('抽奖完成！所有人现在可以查看中奖结果了。')
    } catch (e: any) {
        alert(e.response?.data?.message || '抽奖失败')
    } finally {
        drawing.value = false
    }
}

const copyAddress = () => {
    if (!myGift.value) return
    const text = `姓名: ${myGift.value.real_name}\n电话: ${myGift.value.phone}\n地址: ${myGift.value.address}`
    navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
}

onMounted(fetchData)
</script>

<template>
    <div class="py-12">
        <div v-if="loading" class="text-center py-20 font-mono text-slate-400 animate-pulse">$ loading_activity_data...</div>

        <div v-else class="space-y-8">
            <!-- Welcome Card -->
            <div class="window-card">
                <div class="window-header">
                    <div class="dot bg-[#FF5F56]"></div>
                    <div class="dot bg-[#FFBD2E]"></div>
                    <div class="dot bg-[#27C93F]"></div>
                    <span class="ml-2 text-xs font-mono text-slate-400">~/activity/dashboard</span>
                </div>

                <div class="p-8">
                    <h1 class="text-3xl mb-4">礼物流 GiftFlow</h1>
                    <p class="text-slate-500 mb-8 max-w-2xl">
                        这是一个基于群组的礼物交换平台。大家先填写收货地址并参与活动，最后由群主开启“大风吹”抽奖，每个人都会随机获得一个人的地址，你需要为他准备一份精美的礼物。
                    </p>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="p-6 border border-slate-50 rounded-xl bg-slate-50/50">
                            <h3 class="text-sm font-mono text-slate-400 mb-2">$ activity_status</h3>
                            <div class="flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full" :class="status === 'joining' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'"></span>
                                <span class="font-bold">{{ status === 'joining' ? '报名进行中' : '活动已结束' }}</span>
                            </div>
                        </div>

                        <div class="p-6 border border-slate-50 rounded-xl bg-slate-50/50">
                            <h3 class="text-sm font-mono text-slate-400 mb-2">$ participants_count</h3>
                            <div class="text-2xl font-bold">{{ participantCount }} <span class="text-sm font-normal text-slate-400">人</span></div>
                        </div>

                        <div class="p-6 border border-slate-50 rounded-xl bg-slate-50/50 flex items-center">
                            <button v-if="status === 'joining'" @click="handleJoin" :disabled="joining" class="btn-primary w-full">
                                {{ joining ? '请求中...' : '立即参与' }}
                            </button>
                            <div v-else class="text-center w-full text-slate-400 font-mono text-sm">抽奖已完成</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Result Card (Show after draw) -->
            <div v-if="status === 'drawn'" class="window-card border-primary/30 shadow-primary/10">
                <div class="window-header !bg-primary/5">
                    <div class="dot bg-[#FF5F56]"></div>
                    <div class="dot bg-[#FFBD2E]"></div>
                    <div class="dot bg-[#27C93F]"></div>
                    <span class="ml-2 text-xs font-mono text-primary/60">~/activity/result</span>
                </div>

                <div class="p-8">
                    <template v-if="myGift">
                        <h2 class="text-2xl mb-6 flex items-center gap-2">🎉 你的礼物对象已就绪</h2>
                        <div class="bg-slate-50 rounded-xl p-6 relative group">
                            <button @click="copyAddress" class="absolute top-4 right-4 p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-primary">
                                <Check v-if="copied" class="w-5 h-5 text-green-500" />
                                <Copy v-else class="w-5 h-5" />
                            </button>

                            <div class="space-y-4 font-mono">
                                <div>
                                    <span class="text-slate-400 text-xs">$ receiver_name:</span>
                                    <div class="text-lg font-bold">{{ myGift.real_name }}</div>
                                </div>
                                <div>
                                    <span class="text-slate-400 text-xs">$ contact_phone:</span>
                                    <div class="text-lg">{{ myGift.phone }}</div>
                                </div>
                                <div>
                                    <span class="text-slate-400 text-xs">$ shipping_address:</span>
                                    <div class="text-sm leading-relaxed mt-1">{{ myGift.address }}</div>
                                </div>
                            </div>
                        </div>
                        <p class="mt-6 text-sm text-slate-400 text-center font-mono">> 请尽快发货，并把运单号私发给对方（或在群里告知）。</p>
                    </template>
                    <div v-else class="text-center py-8 text-slate-400">你没有参与本次活动，或者本次抽奖未包含你。</div>
                </div>
            </div>

            <!-- Admin Panel -->
            <div v-if="user.isAdmin" class="window-card border-red-100 shadow-red-50">
                <div class="window-header !bg-red-50/50">
                    <div class="dot bg-[#FF5F56]"></div>
                    <div class="dot bg-[#FFBD2E]"></div>
                    <div class="dot bg-[#27C93F]"></div>
                    <span class="ml-2 text-xs font-mono text-red-400">~/admin/controls</span>
                </div>

                <div class="p-8">
                    <h2 class="text-xl mb-4 text-red-600 font-bold">管理员控制台</h2>
                    <div class="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
                        <div class="flex-1">
                            <p class="text-sm text-red-800">开始抽奖将随机打乱所有参与者并分配礼物对象。此操作无法撤销。</p>
                        </div>
                        <button
                            @click="handleDraw"
                            :disabled="drawing || status === 'drawn' || participantCount < 2"
                            class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors"
                        >
                            {{ status === 'drawn' ? '抽奖已完成' : drawing ? '正在抽奖...' : '立即开启抽奖' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
