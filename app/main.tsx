import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  ReactQueryDevtools
} from '@tanstack/react-query-devtools'

import RootLayout from 'layouts/root-layout/RootLayout'
import ContextMenu from 'components/ContextMenu/ContextMenu'
import Toaster from 'components/Toaster/Toaster'

import { setup } from 'core/auth'
import { queryClient } from 'core/queryClient'
import { toast } from 'core/toasts'

import './styles/index.scss'

setup()

// Dev only, like the devtools below: fire Toasts from the
// DevTools console.
if (import.meta.env.DEV) window.toast = toast

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <RootLayout />
      </HashRouter>

      {/* Outside RootLayout's login check, so Toasts show
          on the login screen too, and so does the menu */}
      <Toaster />
      <ContextMenu />

      {/* Dev only: the production build drops it as dead code. */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          buttonPosition="bottom-left"
          position="bottom"
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  </StrictMode>
)
