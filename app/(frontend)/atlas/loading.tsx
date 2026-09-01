import { EditorialHeader } from '../../_components/editorial-chrome'

export default function AtlasLoading() {
  return <>
    <EditorialHeader active="atlas" />
    <main className="atlas-page ruled-section" aria-busy="true">
      <header className="atlas-hero"><div><p className="eyebrow">03 / Brand Atlas</p><h1>Investigate beyond<br />the homepage.</h1></div><div className="atlas-hero__aside"><span className="skeleton-block" style={{ height: 22, width: '92%' }} /><span className="skeleton-block" style={{ height: 22, width: '74%', marginTop: 10 }} /></div></header>
      <section className="atlas-search"><div><p className="eyebrow">Start a map</p><h2>Find a brand by name or URL.</h2></div><div><span className="skeleton-block" style={{ height: 58, width: '100%' }} /></div></section>
      <div className="atlas-workspace"><aside className="atlas-history"><div className="atlas-panel-heading"><span>History</span><span>—</span></div><div className="atlas-history__loading"><span /><span /><span /></div></aside><section className="atlas-results"><div className="atlas-results__empty"><span className="skeleton-block" style={{ width: 34, height: 34 }} /><span className="skeleton-block" style={{ width: 'min(420px, 80%)', height: 54 }} /><span className="skeleton-block" style={{ width: 'min(330px, 68%)', height: 16 }} /></div></section></div>
    </main>
  </>
}
