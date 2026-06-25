import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { router } from './router'
import { AnimatedBackground } from './components/ui/AnimatedBackground'
import './lib/theme'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AnimatedBackground />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
