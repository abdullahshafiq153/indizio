import { loadLibraryData } from '../_data/load-library-data'
import { IndizioHome } from './indizio-home'

type Mode = 'home' | 'library'

export async function IndizioData({ mode = 'home' }: { mode?: Mode }) {
  const data = await loadLibraryData()

  return (
    <IndizioHome
      initialSites={data.sites}
      initialMember={data.member}
      initialCollections={data.collections}
      initialBookmarks={data.bookmarks}
      mode={mode}
    />
  )
}

export function IndizioDataSkeleton({ mode = 'home' }: { mode?: Mode }) {
  return (
    <IndizioHome
      initialSites={[]}
      initialMember={null}
      initialCollections={[]}
      initialBookmarks={[]}
      mode={mode}
      loading
    />
  )
}
