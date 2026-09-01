import { loadPublicLibraryPage } from '../_data/load-library-data'
import { IndizioHome } from './indizio-home'

type Mode = 'home' | 'library'

export async function IndizioData({ mode = 'home' }: { mode?: Mode }) {
  const data = await loadPublicLibraryPage({ limit: mode === 'library' ? 12 : 9 })

  return (
    <IndizioHome
      initialSites={data.sites}
      initialTotal={data.total}
      filterMetadata={data}
      mode={mode}
    />
  )
}

export function IndizioDataSkeleton({ mode = 'home' }: { mode?: Mode }) {
  return (
    <IndizioHome
      initialSites={[]}
      initialTotal={0}
      filterMetadata={{ industryOptions: [], industryCounts: {}, tagOptionsByIndustry: {}, tagCountsByIndustry: {} }}
      mode={mode}
      loading
    />
  )
}
