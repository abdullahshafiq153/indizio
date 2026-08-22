import { EditorialHeader } from '../../_components/editorial-chrome'

export default function BookmarksLoading() {
  return (
    <>
      <EditorialHeader />
      <main className="bookmarks-page ruled-section" aria-busy="true">
        <div className="section-heading bookmarks-heading">
          <div><p className="eyebrow">Your research library</p><h1>Saved websites.</h1></div>
          <p>Loading your private bookmark library…</p>
        </div>
        <div className="bookmarks-loading-grid" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((item) => <span className="skeleton-block" key={item} />)}
        </div>
      </main>
    </>
  )
}
