import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'

import RootLayout from 'layouts/root-layout/RootLayout'

import { setup } from 'core/auth'
import { queryClient } from 'core/queryClient'

import './styles/index.scss'

setup()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <RootLayout />
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>
)
