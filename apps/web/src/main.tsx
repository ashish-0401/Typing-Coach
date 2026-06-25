import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { router } from './router'
import { AnimatedBackground } from './components/ui/AnimatedBackground'
import { CustomCursor } from './components/ui/CustomCursor'
import { GrainOverlay } from './components/ui/GrainOverlay'
import './lib/theme'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AnimatedBackground />
      <GrainOverlay />
      <CustomCursor />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
