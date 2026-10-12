import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { crearQueryClient } from '@/app/queryClient'

const queryClient = crearQueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
