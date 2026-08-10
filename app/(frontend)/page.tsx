import { IndizioHome } from '../_components/indizio-home'
import { loadLibraryData } from '../_data/load-library-data'

export const revalidate = 300

export default async function HomePage() {
  const data = await loadLibraryData()
  return (
    <IndizioHome
      initialSites={data.sites}
      initialMember={data.member}
      initialCollections={data.collections}
      initialBookmarks={data.bookmarks}
    />
  )
}
