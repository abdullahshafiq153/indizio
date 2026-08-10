const sites = [
  { name: 'Aster & Moss', industry: 'Home', style: 'Editorial', note: 'A quiet homeware storefront that uses proportion and restraint to make a small catalogue feel collectible.', date: 'Aug 08', featured: 12 },
  { name: 'Noma Objects', industry: 'Fashion', style: 'Minimal', note: 'Product storytelling is reduced to a precise sequence of material, fit, and provenance.', date: 'Aug 07', featured: 11 },
  { name: 'Sunday Press', industry: 'Food', style: 'Bold', note: 'Subscription framing appears before price, turning replenishment into the default mental model.', date: 'Aug 05', featured: 10 },
  { name: 'Forme Studio', industry: 'Fashion', style: 'Editorial', note: 'Editorial hierarchy and disciplined navigation let campaign imagery lead without hiding commerce.', date: 'Aug 02', featured: 9 },
  { name: 'Ritual State', industry: 'Health', style: 'Organic', note: 'Trust signals are woven into the product narrative instead of isolated in a badge wall.', date: 'Jul 29', featured: 8 },
  { name: 'Arc Systems', industry: 'Technology', style: 'Dark', note: 'A technical product is made legible through progressive disclosure and unusually direct comparison copy.', date: 'Jul 25', featured: 7 },
  { name: 'Morrow Skin', industry: 'Beauty', style: 'Minimal', note: 'The PDP balances clinical specificity with a warmer, less institutional visual system.', date: 'Jul 21', featured: 6 },
  { name: 'Field Day', industry: 'Food', style: 'Playful', note: 'Merchandising feels exploratory while repeated product anchors keep the path to purchase obvious.', date: 'Jul 17', featured: 5 },
  { name: 'Parlour No. 8', industry: 'Beauty', style: 'Luxury', note: 'Luxury is communicated through pacing and language rather than decorative excess.', date: 'Jul 12', featured: 4 },
  { name: 'Northland', industry: 'Fashion', style: 'Bold', note: 'A dense product range remains easy to scan because every category decision is visible in the grid.', date: 'Jul 08', featured: 3 },
  { name: 'Common Matter', industry: 'Home', style: 'Minimal', note: 'The store turns specifications into editorial detail, helping considered purchases feel effortless.', date: 'Jul 04', featured: 2 },
  { name: 'Signal Works', industry: 'Technology', style: 'Retro', note: 'A retro visual language supports the product story without compromising technical clarity.', date: 'Jun 28', featured: 1 },
  { name: 'Solace Labs', industry: 'Health', style: 'Minimal', note: 'Benefit claims are paired with evidence at exactly the point a skeptical buyer needs it.', date: 'Jun 25', featured: 0 },
  { name: 'Cose Buone', industry: 'Food', style: 'Editorial', note: 'The store uses origin stories as merchandising, making product discovery feel like travel.', date: 'Jun 20', featured: -1 },
  { name: 'Vera Forma', industry: 'Fashion', style: 'Luxury', note: 'Collection navigation is exceptionally restrained while fit details stay close to purchase actions.', date: 'Jun 17', featured: -2 },
  { name: 'Lumen', industry: 'Technology', style: 'Minimal', note: 'A single-product site that explains complexity through an unusually confident content sequence.', date: 'Jun 12', featured: -3 },
  { name: 'Soft Focus', industry: 'Beauty', style: 'Playful', note: 'Shade discovery and education share the same interface, reducing the jump between learning and buying.', date: 'Jun 07', featured: -4 },
  { name: 'Casa Prima', industry: 'Home', style: 'Organic', note: 'Room context, dimensions, and delivery expectations are layered without crowding the product.', date: 'Jun 01', featured: -5 },
];

function loadBookmarks() {
  try { return new Set(JSON.parse(localStorage.getItem('indizio-bookmarks') || '[]')); }
  catch { return new Set(); }
}

const state = { authenticated: localStorage.getItem('indizio-authenticated') === 'true', search: '', industries: new Set(), bookmarks: loadBookmarks(), sort: 'featured', visible: 9 };
const grid = document.querySelector('#card-grid');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');
const loadMore = document.querySelector('#load-more');
const filterPanel = document.querySelector('#filter-panel');
const filterTrigger = document.querySelector('#filter-trigger');
const filterCount = document.querySelector('#filter-count');
const industries = [...new Set(sites.map(site => site.industry))].sort();
const authDialog = document.querySelector('#auth-dialog');
const accountButtons = [document.querySelector('#account-button'), document.querySelector('#mobile-account-button')];
const bookmarkCollection = document.querySelector('#bookmark-collection');
const bookmarkTotal = document.querySelector('#bookmark-total');
let pendingBookmark = null;

function renderAccount() {
  accountButtons.forEach(button => { button.textContent = state.authenticated ? 'Log out' : 'Log in'; });
  bookmarkCollection.hidden = !state.authenticated;
  bookmarkTotal.textContent = state.bookmarks.size;
}

function openAuth(bookmarkName = null) {
  pendingBookmark = bookmarkName;
  authDialog.showModal();
}

function filteredSites() {
  const query = state.search.trim().toLowerCase();
  const filtered = sites.filter(site => {
    const textMatch = !query || `${site.name} ${site.industry} ${site.style} ${site.note}`.toLowerCase().includes(query);
    const industryMatch = !state.industries.size || state.industries.has(site.industry);
    return textMatch && industryMatch;
  });
  return filtered.sort((a, b) => state.sort === 'az' ? a.name.localeCompare(b.name) : state.sort === 'newest' ? sites.indexOf(a) - sites.indexOf(b) : b.featured - a.featured);
}

function render() {
  const filtered = filteredSites();
  const visible = filtered.slice(0, state.visible);
  resultCount.textContent = filtered.length;
  filterCount.textContent = state.industries.size;
  grid.innerHTML = visible.map((site, index) => {
    const bookmarked = state.authenticated && state.bookmarks.has(site.name);
    return `
    <article class="site-card">
      <div class="card-visual">
        <button class="card-open" type="button" data-site="${site.name}" aria-label="Open ${site.name} fieldnote">
          <span class="card-index">${String(index + 1).padStart(2, '0')} / ${site.industry.toUpperCase()}</span>
          <span class="card-mark">${site.name}</span>
        </button>
      </div>
      <div class="card-meta">
        <div class="card-title-row">
          <h3>${site.name}</h3>
          <div class="card-actions">
            <a class="card-action" href="https://example.com" target="_blank" rel="noreferrer" aria-label="Visit ${site.name} website">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 3h8v8M13 3 3 13" stroke="currentColor" stroke-width="1.4"/></svg>
            </a>
            <button class="card-action" type="button" data-bookmark="${site.name}" aria-label="${state.authenticated ? (bookmarked ? 'Remove' : 'Bookmark') : 'Sign up to bookmark'} ${site.name}" aria-pressed="${bookmarked}">
              <svg viewBox="0 0 16 16" fill="${bookmarked ? 'currentColor' : 'none'}" aria-hidden="true"><path d="M3.5 2.5h9v11l-4.5-3-4.5 3v-11Z" stroke="currentColor" stroke-width="1.4"/></svg>
            </button>
          </div>
        </div>
        <div class="card-detail-row"><p>${site.industry} · ${site.style}</p></div>
      </div>
    </article>`;
  }).join('');
  emptyState.hidden = filtered.length > 0;
  loadMore.hidden = state.visible >= filtered.length;
  document.querySelector('#site-count').textContent = String(sites.length).padStart(2, '0');
  renderAccount();
}

const filterOptions = document.querySelector('#industry-filters');
filterOptions.innerHTML = industries.map(industry => `<button class="filter-chip" type="button" data-industry="${industry}">${industry}</button>`).join('');

document.querySelector('#search-input').addEventListener('input', event => { state.search = event.target.value; state.visible = 9; render(); });
document.querySelector('#sort-select').addEventListener('change', event => { state.sort = event.target.value; render(); });
filterTrigger.addEventListener('click', () => { const open = filterPanel.hidden; filterPanel.hidden = !open; filterTrigger.setAttribute('aria-expanded', String(open)); });
filterOptions.addEventListener('click', event => {
  const button = event.target.closest('[data-industry]'); if (!button) return;
  const value = button.dataset.industry; state.industries.has(value) ? state.industries.delete(value) : state.industries.add(value);
  button.classList.toggle('active'); state.visible = 9; render();
});
function resetFilters() { state.search = ''; state.industries.clear(); state.visible = 9; document.querySelector('#search-input').value = ''; document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active')); render(); }
document.querySelector('#clear-filters').addEventListener('click', resetFilters);
document.querySelector('#reset-empty').addEventListener('click', resetFilters);
loadMore.addEventListener('click', () => { state.visible += 6; render(); });

document.querySelectorAll('[data-industry-jump]').forEach(button => button.addEventListener('click', () => {
  resetFilters(); state.industries.add(button.dataset.industryJump); document.querySelector(`[data-industry="${button.dataset.industryJump}"]`)?.classList.add('active'); filterPanel.hidden = false; filterTrigger.setAttribute('aria-expanded', 'true'); render(); document.querySelector('#library').scrollIntoView();
}));

const dialog = document.querySelector('#site-dialog');
grid.addEventListener('click', event => {
  const bookmark = event.target.closest('[data-bookmark]');
  if (bookmark) {
    const name = bookmark.dataset.bookmark;
    if (!state.authenticated) {
      openAuth(name);
      return;
    }
    state.bookmarks.has(name) ? state.bookmarks.delete(name) : state.bookmarks.add(name);
    try { localStorage.setItem('indizio-bookmarks', JSON.stringify([...state.bookmarks])); } catch {}
    render();
    return;
  }
  const button = event.target.closest('[data-site]'); if (!button) return;
  const site = sites.find(item => item.name === button.dataset.site);
  document.querySelector('#dialog-content').innerHTML = `<div class="dialog-visual">${site.name}</div><div class="dialog-copy"><p class="eyebrow">${site.industry} / ${site.style}</p><h2>${site.name}</h2><p>${site.note}</p><a class="line-button line-button--dark" href="#"><span>Visit storefront</span><span class="line-button__icon">↗</span></a></div>`;
  dialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

accountButtons.forEach(button => button.addEventListener('click', () => {
  if (state.authenticated) {
    state.authenticated = false;
    localStorage.setItem('indizio-authenticated', 'false');
    render();
  } else {
    openAuth();
  }
}));

document.querySelector('.auth-dialog__close').addEventListener('click', () => authDialog.close());
authDialog.addEventListener('click', event => { if (event.target === authDialog) authDialog.close(); });
document.querySelector('#auth-form').addEventListener('submit', event => {
  event.preventDefault();
  state.authenticated = true;
  localStorage.setItem('indizio-authenticated', 'true');
  if (pendingBookmark) {
    state.bookmarks.add(pendingBookmark);
    localStorage.setItem('indizio-bookmarks', JSON.stringify([...state.bookmarks]));
  }
  pendingBookmark = null;
  event.target.reset();
  authDialog.close();
  render();
});

document.querySelector('#newsletter-form').addEventListener('submit', event => {
  event.preventDefault(); const email = new FormData(event.target).get('email');
  document.querySelector('#form-message').textContent = `Fieldnote reserved for ${email}. Beehiiv connection follows in the production build.`;
  event.target.reset();
});

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
menuToggle.addEventListener('click', () => { const open = mobileMenu.hidden; mobileMenu.hidden = !open; menuToggle.setAttribute('aria-expanded', String(open)); });
mobileMenu.addEventListener('click', () => { mobileMenu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); });

render();
