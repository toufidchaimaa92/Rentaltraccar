import '../css/app.css'
import './bootstrap'

import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot, hydrateRoot } from 'react-dom/client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { SearchProvider } from '@/context/search-context'

createInertiaApp({
  resolve: (name) =>
    resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
  setup({ el, App, props }) {
    const app = (
      <TooltipProvider>
        <SearchProvider>
          <App {...props} />
        </SearchProvider>
      </TooltipProvider>
    )

    if (import.meta.env.SSR) {
      hydrateRoot(el, app)
      return
    }

    createRoot(el).render(app)
  },
  progress: {
    color: '#ffffff',
  },
})
