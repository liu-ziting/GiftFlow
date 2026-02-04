<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'
import { Copy, Check, Gift, Users, Zap, ShieldAlert, RefreshCw, Trash2, PartyPopper, Hash, Plus, Eye, ArrowRight, X } from 'lucide-vue-next'
import { useModal } from '../useModal'

const { show } = useModal()
const status = ref('joining')
const groupName = ref('')
const participantCount = ref(0)
const myGift = ref<any>(null)
const user = JSON.parse(localStorage.getItem('user') || '{}')
const loading = ref(true)
const joining = ref(false)
const drawing = ref(false)
const copied = ref(false)
const users = ref<any[]>([])
const loadingUsers = ref(false)

// Invite Code Management
const inviteCodes = ref<any[]>([])
const loadingCodes = ref(false)
const newCode = ref({ code: '', group_name: '' })
const drawResults = ref<any[]>([])
const viewingResults = ref(false)
const viewingGroupName = ref('')

const fetchData = async () => {
    try {
        const [statusRes, giftRes] = await Promise.all([api.get('/status'), api.get('/my-gift')])
        status.value = statusRes.data.status
        groupName.value = statusRes.data.groupName
        participantCount.value = statusRes.data.participantCount
        myGift.value = giftRes.data.result

        if (user.isAdmin) {
            fetchUsers()
            fetchInviteCodes()
        }
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const fetchUsers = async () => {
    loadingUsers.value = true
    try {
        const res = await api.get('/admin/users')
        users.value = res.data
    } catch (e) {
        console.error(e)
    } finally {
        loadingUsers.value = false
    }
}

const fetchInviteCodes = async () => {
    loadingCodes.value = true
    try {
        const res = await api.get('/admin/invite-codes')
        inviteCodes.value = res.data
    } catch (e) {
        console.error(e)
    } finally {
        loadingCodes.value = false
    }
}

const handleAddInviteCode = async () => {
    if (!newCode.value.code || !newCode.value.group_name) return
    try {
        await api.post('/admin/invite-codes', newCode.value)
        newCode.value = { code: '', group_name: '' }
        fetchInviteCodes()
        show({ title: '创建成功', message: '新的邀请码已启用', type: 'success' })
    } catch (e: any) {
        show({ title: '创建失败', message: e.response?.data?.message || '操作失败', type: 'error' })
    }
}

const handleDeleteInviteCode = async (id: number) => {
    show({
        title: '确认删除',
        message: '确定要删除这个邀请码吗？如果已有用户使用则无法删除。',
        type: 'confirm',
        onConfirm: async () => {
            try {
                await api.delete(`/admin/invite-codes/${id}`)
                fetchInviteCodes()
                show({ title: '已删除', message: '邀请码已成功移除', type: 'success' })
            } catch (e: any) {
                show({ title: '删除失败', message: e.response?.data?.message || '操作失败', type: 'error' })
            }
        }
    })
}

const handleDeleteUser = async (id: number) => {
    show({
        title: '确认删除',
        message: '确定要删除该用户吗？相关参与记录和抽奖结果也将被清除。',
        type: 'confirm',
        onConfirm: async () => {
            try {
                await api.delete(`/admin/users/${id}`)
                fetchUsers()
                fetchData()
                show({ title: '已删除', message: '用户已成功移除', type: 'success' })
            } catch (e: any) {
                show({ title: '删除失败', message: e.response?.data?.message || '操作失败', type: 'error' })
            }
        }
    })
}

const handleJoin = async () => {
    joining.value = true
    try {
        await api.post('/join')
        await fetchData()
        show({ title: '参与成功', message: '你已成功加入本次礼物交换活动！', type: 'success' })
    } catch (e: any) {
        show({ title: '参与失败', message: e.response?.data?.message || '操作失败', type: 'error' })
    } finally {
        joining.value = false
    }
}

const handleDraw = async (inviteCodeId?: number) => {
    const isTargetingSpecificGroup = inviteCodeId !== undefined
    const targetId = inviteCodeId || user.inviteCodeId

    show({
        title: '开启抽奖',
        message: isTargetingSpecificGroup
            ? '确定要开始该群组的抽奖吗？此操作不可逆，将立即为该群组的所有人随机分配礼物对象。'
            : '确定要开始抽奖吗？此操作不可逆，将立即为当前群组的所有人随机分配礼物对象。',
        type: 'confirm',
        onConfirm: async () => {
            drawing.value = true
            try {
                await api.post('/admin/draw', { inviteCodeId: targetId })
                await fetchData()
                show({ title: '匹配完成', message: '礼物对象已随机分配，快去查看吧！', type: 'success' })
            } catch (e: any) {
                show({ title: '抽奖失败', message: e.response?.data?.message || '操作失败', type: 'error' })
            } finally {
                drawing.value = false
            }
        }
    })
}

const handleViewResults = async (inviteCode: any) => {
    try {
        const res = await api.get(`/admin/draw-results/${inviteCode.id}`)
        drawResults.value = res.data
        viewingGroupName.value = inviteCode.group_name
        viewingResults.value = true
    } catch (e: any) {
        show({ title: '获取失败', message: e.response?.data?.message || '操作失败', type: 'error' })
    }
}

const copyAddress = () => {
    if (!myGift.value) return
    const text = `收件人: ${myGift.value.real_name}\n电话: ${myGift.value.phone}\n地址: ${myGift.value.address}`
    navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
}

onMounted(fetchData)
</script>

<template>
    <div class="py-8 space-y-12">
        <div v-if="loading" class="flex flex-col items-center justify-center py-24 space-y-4">
            <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p class="text-slate-400 font-bold tracking-widest text-xs uppercase">正在连接礼物中心...</p>
        </div>

        <div v-else class="space-y-12">
            <!-- Hero Section -->
            <section class="relative overflow-hidden gift-card p-8 md:p-12">
                <div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div class="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <div class="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div class="flex-1 space-y-6 text-center md:text-left">
                        <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                            <PartyPopper class="w-4 h-4" />
                            <span>新年礼物交换活动</span>
                        </div>
                        <h1 class="text-4xl md:text-6xl font-black leading-tight">让每一份礼物<br /><span class="text-primary">都充满惊喜</span></h1>
                        <p class="text-slate-500 text-lg leading-relaxed max-w-xl">
                            GiftFlow 是一个温暖的群组礼物交换平台。大家先填写收货地址并参与活动，最后由发起人开启“大风吹”抽奖，每个人都会随机获得一个人的地址。
                        </p>

                        <div v-if="!user.isAdmin" class="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
                            <div class="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">所在群组：{{ groupName }}</div>
                        </div>
                        <div v-if="!user.isAdmin" class="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
                            <button v-if="status === 'joining'" @click="handleJoin" :disabled="joining" class="btn-primary group">
                                <Zap v-if="!joining" class="w-5 h-5 group-hover:fill-current transition-all" />
                                <span>{{ joining ? '加入中...' : '立即参与活动' }}</span>
                            </button>
                            <div v-else class="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl font-bold flex items-center gap-2">
                                <Check class="w-5 h-5" />
                                抽奖已结束
                            </div>
                        </div>
                        <div v-else class="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
                            <div class="px-8 py-3 bg-accent text-white rounded-2xl font-bold flex items-center gap-2">
                                <ShieldAlert class="w-5 h-5" />
                                管理员模式
                            </div>
                        </div>
                    </div>

                    <div v-if="!user.isAdmin" class="w-full md:w-80 grid grid-cols-2 gap-4">
                        <div class="p-6 bg-white border-2 border-slate-50 rounded-3xl text-center space-y-2">
                            <div class="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <RefreshCw class="w-5 h-5" :class="{ 'animate-spin': status === 'joining' }" />
                            </div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">活动状态</p>
                            <p class="font-black text-slate-800">{{ status === 'joining' ? '进行中' : '已揭晓' }}</p>
                        </div>
                        <div class="p-6 bg-white border-2 border-slate-50 rounded-3xl text-center space-y-2">
                            <div class="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Users class="w-5 h-5" />
                            </div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">参与人数</p>
                            <p class="font-black text-slate-800">{{ participantCount }} 人</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Result Section -->
            <section v-if="status === 'drawn' && !user.isAdmin" class="space-y-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Gift class="w-5 h-5" />
                    </div>
                    <h2 class="text-2xl font-black">我的中奖结果</h2>
                </div>

                <div v-if="myGift" class="gift-card bg-gradient-to-br from-primary to-primary-hover p-1 text-white">
                    <div class="bg-slate-900 rounded-[calc(1.5rem-2px)] p-8 md:p-12 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>

                        <div class="relative z-10 flex flex-col md:flex-row gap-12 items-start">
                            <div class="space-y-8 flex-1">
                                <div class="space-y-6">
                                    <p class="text-primary font-bold tracking-widest text-xs uppercase opacity-80">你需要寄送礼物的对象信息</p>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div class="space-y-2">
                                            <p class="text-slate-500 font-bold text-xs uppercase tracking-widest">收件人</p>
                                            <p class="text-2xl font-black text-slate-100">{{ myGift.real_name }}</p>
                                        </div>
                                        <div class="space-y-2">
                                            <p class="text-slate-500 font-bold text-xs uppercase tracking-widest">联系电话</p>
                                            <p class="text-2xl font-black text-slate-100">{{ myGift.phone }}</p>
                                        </div>
                                        <div class="md:col-span-2 space-y-2">
                                            <p class="text-slate-500 font-bold text-xs uppercase tracking-widest">收货地址</p>
                                            <p class="text-xl font-bold leading-relaxed text-slate-200">{{ myGift.address }}</p>
                                        </div>
                                    </div>
                                </div>

                                <button @click="copyAddress" class="btn-primary !bg-white !text-slate-900 !shadow-none hover:!bg-slate-100 mt-4">
                                    <Check v-if="copied" class="w-5 h-5 text-green-500" />
                                    <Copy v-else class="w-5 h-5" />
                                    <span>{{ copied ? '已复制全部信息' : '一键复制寄送信息' }}</span>
                                </button>
                            </div>

                            <div class="hidden md:block w-48 h-48 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 animate-bounce">
                                <Gift class="w-24 h-24 text-primary" />
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="gift-card p-12 text-center text-slate-400 font-medium bg-slate-50 border-dashed">很遗憾，你没有参与本次活动，请期待下一次惊喜。</div>
            </section>

            <!-- Admin Controls -->
            <section v-if="user.isAdmin" class="space-y-8">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center">
                        <ShieldAlert class="w-5 h-5" />
                    </div>
                    <h2 class="text-2xl font-black">管理后台</h2>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Invite Codes Mgmt -->
                    <div class="lg:col-span-3 gift-card overflow-hidden">
                        <div class="gift-card-header">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                    <Hash class="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 class="font-black text-lg">邀请码管理</h3>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">创建不同的群组，每个群组独立抽奖</p>
                                </div>
                            </div>
                        </div>

                        <div class="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end border-b border-slate-50">
                            <div class="md:col-span-1 space-y-2">
                                <label class="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">邀请码 (唯一)</label>
                                <input v-model="newCode.code" type="text" class="input-field !py-2.5 !text-sm" placeholder="如: GIFT2026" />
                            </div>
                            <div class="md:col-span-2 space-y-2">
                                <label class="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">群组名称</label>
                                <input v-model="newCode.group_name" type="text" class="input-field !py-2.5 !text-sm" placeholder="如: 摸鱼小分队" />
                            </div>
                            <button @click="handleAddInviteCode" :disabled="!newCode.code || !newCode.group_name" class="btn-primary !py-2.5 !text-sm">
                                <Plus class="w-4 h-4" />
                                <span>创建群组</span>
                            </button>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th class="px-8 py-4">邀请码</th>
                                        <th class="px-8 py-4">群组名称</th>
                                        <th class="px-8 py-4 text-center">参与人数</th>
                                        <th class="px-8 py-4 text-center">状态</th>
                                        <th class="px-8 py-4 text-right">管理操作</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50">
                                    <tr v-for="c in inviteCodes" :key="c.id" class="group hover:bg-bg-soft transition-colors">
                                        <td class="px-8 py-4">
                                            <code class="px-2 py-1 bg-slate-100 text-slate-600 rounded font-mono text-sm font-bold">{{ c.code }}</code>
                                        </td>
                                        <td class="px-8 py-4 font-bold text-slate-700">{{ c.group_name }}</td>
                                        <td class="px-8 py-4 text-center font-bold text-slate-600">{{ c.participant_count }} 人</td>
                                        <td class="px-8 py-4 text-center">
                                            <span
                                                :class="[
                                                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold',
                                                    c.status === 'joining' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                                                ]"
                                            >
                                                <div :class="['w-1 h-1 rounded-full', c.status === 'joining' ? 'bg-green-500 animate-pulse' : 'bg-slate-400']"></div>
                                                {{ c.status === 'joining' ? '招募中' : '已揭晓' }}
                                            </span>
                                        </td>
                                        <td class="px-8 py-4 text-right space-x-2">
                                            <button
                                                v-if="c.status === 'joining'"
                                                @click="handleDraw(c.id)"
                                                :disabled="drawing || c.participant_count < 2"
                                                class="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all"
                                            >
                                                开启抽奖
                                            </button>
                                            <button
                                                v-else
                                                @click="handleViewResults(c)"
                                                class="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all inline-flex items-center gap-1"
                                            >
                                                <Eye class="w-3 h-3" />
                                                查看结果
                                            </button>
                                            <button
                                                @click="handleDeleteInviteCode(c.id)"
                                                class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all inline-block align-middle"
                                            >
                                                <Trash2 class="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- User Management -->
                    <div class="lg:col-span-3 gift-card overflow-hidden flex flex-col">
                        <div class="gift-card-header">
                            <div class="flex flex-col">
                                <h3 class="font-black text-lg">全平台用户管理</h3>
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">共 {{ users.length }} 人注册</p>
                            </div>
                            <button @click="fetchUsers" class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-primary">
                                <RefreshCw class="w-5 h-5" :class="{ 'animate-spin': loadingUsers }" />
                            </button>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th class="px-6 py-4">用户</th>
                                        <th class="px-6 py-4">所属群组</th>
                                        <th class="px-6 py-4 text-center">状态</th>
                                        <th class="px-6 py-4">身份</th>
                                        <th class="px-6 py-4 text-right">管理</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50">
                                    <tr v-for="u in users" :key="u.id" class="group hover:bg-bg-soft transition-colors">
                                        <td class="px-6 py-4">
                                            <div class="flex flex-col">
                                                <span class="font-bold text-slate-700">{{ u.username }}</span>
                                                <span class="text-[10px] text-slate-400">{{ u.real_name || '未填写实名' }}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <span class="text-xs font-bold text-slate-500">{{ u.group_name || '-' }}</span>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <span
                                                :class="[
                                                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold',
                                                    u.is_participating ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                                                ]"
                                            >
                                                <div :class="['w-1 h-1 rounded-full', u.is_participating ? 'bg-green-500' : 'bg-slate-400']"></div>
                                                {{ u.is_participating ? '已参与' : '未参与' }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4">
                                            <span v-if="u.is_admin" class="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded text-[10px] font-black uppercase"
                                                >Admin</span
                                            >
                                            <span v-else class="text-[10px] font-bold text-slate-400 uppercase">User</span>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <button
                                                @click="handleDeleteUser(u.id)"
                                                :disabled="u.id === user.id"
                                                class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-0"
                                            >
                                                <Trash2 class="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="loadingUsers && users.length === 0">
                                        <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium">加载中...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>

    <!-- Draw Results Modal -->
    <div v-if="viewingResults" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div class="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Gift class="w-5 h-5" />
                    </div>
                    <div>
                        <h3 class="font-black text-slate-800">抽奖结果 - {{ viewingGroupName }}</h3>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">管理员查看模式：仅显示姓名配对</p>
                    </div>
                </div>
                <button @click="viewingResults = false" class="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                    <X class="w-5 h-5" />
                </button>
            </div>

            <div class="max-h-[60vh] overflow-y-auto p-6">
                <div class="space-y-3">
                    <div
                        v-for="(r, idx) in drawResults"
                        :key="idx"
                        class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all"
                    >
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">送礼人</span>
                            <span class="font-black text-slate-700">{{ r.giver_name || r.giver_username }}</span>
                        </div>

                        <div class="flex flex-col items-center px-4">
                            <div class="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                <ArrowRight class="w-4 h-4" />
                            </div>
                        </div>

                        <div class="flex flex-col text-right">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">收礼人</span>
                            <span class="font-black text-slate-700">{{ r.receiver_name || r.receiver_username }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-6 bg-slate-50/50 border-t border-slate-50">
                <button
                    @click="viewingResults = false"
                    class="w-full py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
                >
                    关闭预览
                </button>
            </div>
        </div>
    </div>
</template>
