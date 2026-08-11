export default function FieldnotesLoading() {
  return (
    <main className="fieldnotes-page ruled-section" aria-busy="true" aria-label="Loading fieldnotes">
      <header className="fieldnotes-hero">
        <div><p className="eyebrow">03 / CRO Fieldnotes</p><h1>Research for better decisions.</h1></div>
        <p>Long-form brand teardowns, industry blueprints, and conversion patterns.</p>
      </header>
      <div className="fieldnotes-list">
        {[0, 1, 2, 3].map((item) => <div className="fieldnote-row fieldnote-row--skeleton" key={item}><span className="skeleton-block" /><div><span className="skeleton-block" /><span className="skeleton-block" /><span className="skeleton-block" /></div></div>)}
      </div>
    </main>
  )
}
