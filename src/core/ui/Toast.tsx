import { useEffect } from 'react'
import { create } from 'zustand'

const useToastStore = create<{ message: string | null; key: number }>()(() => ({ message: null, key: 0 }))

/** Muestra un aviso breve en la parte inferior (p. ej. "Se reproducirá a continuación"). */
export function showToast(message: string) {
  useToastStore.setState((s) => ({ message, key: s.key + 1 }))
}

export function Toast() {
  const { message, key } = useToastStore()

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => useToastStore.setState({ message: null }), 2200)
    return () => window.clearTimeout(timer)
  }, [message, key])

  if (!message) return null
  return (
    <div
      key={key}
      role="status"
      className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),12px)] z-[60] flex justify-center px-5"
    >
      <p className="animate-toast rounded-full bg-text-primary px-4 py-2.5 text-sm font-medium text-background shadow-lg">
        {message}
      </p>
    </div>
  )
}
