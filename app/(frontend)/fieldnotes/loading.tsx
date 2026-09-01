import { EditorialHeader } from '../../_components/editorial-chrome'

export default function FieldnotesLoading() {
  return (
    <>
      <EditorialHeader active="fieldnotes" />
      <main className="fieldnotes-page ruled-section" aria-busy="true" aria-label="Loading fieldnotes">
        <header className="fieldnotes-hero">
          <div><p className="eyebrow">02 / CRO Fieldnotes</p><h1>Understand what stronger storefronts do differently.</h1></div>
          <p>Long-form brand teardowns, industry blueprints, and conversion patterns.</p>
        </header>
        <section className="featured-fieldnotes featured-fieldnotes--skeleton" aria-label="Loading featured notes">
          <div className="featured-fieldnotes__heading"><span className="skeleton-block" /><span className="skeleton-block" /></div>
          <div className="featured-fieldnotes__grid">{[0, 1].map((item) => <div className="featured-fieldnote" key={item}><span className="skeleton-block" /><span className="skeleton-block" /><span className="skeleton-block" /></div>)}</div>
        </section>
        <div className="fieldnotes-list">
          {[0, 1, 2, 3].map((item) => <div className="fieldnote-row fieldnote-row--skeleton" key={item}><span className="skeleton-block" /><div><span className="skeleton-block" /><span className="skeleton-block" /><span className="skeleton-block" /></div></div>)}
        </div>
      </main>
    </>
  )
}
