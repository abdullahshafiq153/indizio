import { EditorialHeader } from '../../_components/editorial-chrome'

export default function AccountLoading() {
  return <>
    <EditorialHeader />
    <main className="account-page" aria-busy="true">
      <section className="account-hero"><p className="eyebrow">Your INDIZIO account</p><h1>Manage account.</h1><span className="skeleton-block" style={{ width: 'min(390px, 100%)', height: 44 }} /></section>
      <div className="account-grid"><aside className="account-summary"><span className="skeleton-block" style={{ width: 58, height: 58, marginBottom: 12 }} /><span className="skeleton-block" style={{ width: 150, height: 18 }} /><span className="skeleton-block" style={{ width: 210, height: 13 }} /></aside><div className="account-sections"><section className="account-section"><div><p className="eyebrow">Profile</p><h2>Your details</h2></div><div><span className="skeleton-block" style={{ height: 50, marginBottom: 18 }} /><span className="skeleton-block" style={{ height: 50, marginBottom: 18 }} /><span className="skeleton-block" style={{ width: 160, height: 52 }} /></div></section></div></div>
    </main>
  </>
}
