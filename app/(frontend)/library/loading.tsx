const skeletonCards = Array.from({ length: 9 }, (_, index) => index)

export default function LibraryLoading() {
  return (
    <>
      <div className="announcement library-loading__announcement">
        <span>Loading the INDIZIO index</span>
      </div>
      <header className="site-header library-loading__header">
        <span className="wordmark">INDIZIO<span className="wordmark-dot">●</span></span>
        <span className="skeleton-block library-loading__nav" />
      </header>
      <main>
        <section className="library library--page ruled-section" aria-busy="true" aria-label="Loading website library">
          <div className="section-heading">
            <div>
              <span className="skeleton-block library-loading__eyebrow" />
              <span className="skeleton-block library-loading__title" />
            </div>
            <span className="skeleton-block library-loading__description" />
          </div>
          <div className="skeleton-block library-loading__tools" />
          <div className="skeleton-block library-loading__meta" />
          <div className="card-grid skeleton-grid">
            {skeletonCards.map((item) => (
              <article className="skeleton-card" key={item}>
                <span className="skeleton-block skeleton-card__visual" />
                <span className="skeleton-block skeleton-card__title" />
                <span className="skeleton-block skeleton-card__detail" />
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
