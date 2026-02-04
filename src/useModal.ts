import { ref, type Component } from 'vue'
import { AlertCircle, CheckCircle2, Info, HelpCircle } from 'lucide-vue-next'

export type ModalType = 'info' | 'success' | 'error' | 'confirm'

interface ModalOptions {
    title: string
    message: string
    type?: ModalType
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    onCancel?: () => void
}

const isVisible = ref(false)
const options = ref<ModalOptions>({
    title: '',
    message: '',
    type: 'info'
})

export const useModal = () => {
    const show = (opts: ModalOptions) => {
        options.value = {
            type: 'info',
            confirmText: '确定',
            cancelText: '取消',
            ...opts
        }
        isVisible.value = true
    }

    const hide = () => {
        isVisible.value = false
    }

    const confirm = () => {
        if (options.value.onConfirm) options.value.onConfirm()
        hide()
    }

    const cancel = () => {
        if (options.value.onCancel) options.value.onCancel()
        hide()
    }

    return {
        isVisible,
        options,
        show,
        hide,
        confirm,
        cancel
    }
}

export const getIcon = (type?: ModalType): Component => {
    switch (type) {
        case 'success': return CheckCircle2
        case 'error': return AlertCircle
        case 'confirm': return HelpCircle
        default: return Info
    }
}

export const getIconClass = (type?: ModalType): string => {
    switch (type) {
        case 'success': return 'bg-green-50 text-green-500'
        case 'error': return 'bg-red-50 text-red-500'
        case 'confirm': return 'bg-primary/5 text-primary'
        default: return 'bg-blue-50 text-blue-500'
    }
}
