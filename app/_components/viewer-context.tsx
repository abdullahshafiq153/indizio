'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

import type { EditorialViewer } from '../_data/editorial-viewer'

type ViewerContextValue = EditorialViewer & { loading: boolean; refresh: () => void }

const ViewerContext = createContext<ViewerContextValue>({ member: null, bookmarkCount: 0, loading: true, refresh: () => undefined })

export function ViewerProvider({ children }: { children: ReactNode }) {
  const [viewer, setViewer] = useState<EditorialViewer>({ member: null, bookmarkCount: 0 })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    const controller = new AbortController()
    void fetch('/api/viewer', { cache: 'no-store', signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((next: EditorialViewer) => setViewer(next))
      .catch(() => undefined)
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  useEffect(() => refresh(), [refresh])
  useEffect(() => {
    const handleChange = () => refresh()
    window.addEventListener('indizio:viewer-changed', handleChange)
    return () => window.removeEventListener('indizio:viewer-changed', handleChange)
  }, [refresh])

  return <ViewerContext.Provider value={{ ...viewer, loading, refresh }}>{children}</ViewerContext.Provider>
}

export function useViewer() {
  return useContext(ViewerContext)
}
