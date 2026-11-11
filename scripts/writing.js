// Renders essay cards from data/writing.json into #writing-grid.
// To add a post, add one entry to data/writing.json — both the homepage
// and the Writing page update from it.
//
// Entry fields: title, link, date (YYYY-MM-DD), category,
//   description (optional), kind ("essay" | "analysis"),
//   featured (optional, true pins it to the homepage selection).
//
// The grid's data-limit attribute caps how many cards are shown.

const writingGrid = document.getElementById('writing-grid');

if (writingGrid) {
  fetch('data/writing.json?v=20261111')
    .then(response => {
      if (!response.ok) throw new Error(`Writing data returned ${response.status}`);
      return response.json();
    })
    .then(posts => {
      const limit = Number(writingGrid.dataset.limit) || posts.length;
      const byDate = (a, b) => (b.date || '').localeCompare(a.date || '');
      let sorted = [...posts].sort(byDate);

      // A limited grid (the homepage) leads with featured posts, then newest.
      if (limit < posts.length) {
        sorted = [
          ...sorted.filter(post => post.featured),
          ...sorted.filter(post => !post.featured)
        ];
      }

      writingGrid.innerHTML = sorted.slice(0, limit).map(renderPost).join('');
    })
    .catch(error => {
      console.error('Error loading writing:', error);
      writingGrid.innerHTML = `
        <div class="no-results">
          <h2>Essays are temporarily unavailable here.</h2>
          <p><a href="https://wardwalton.substack.com/" target="_blank" rel="noopener">Read them on Substack ↗</a></p>
        </div>
      `;
    });
}

function renderPost(post) {
  const description = post.description
    ? `<p>${escapeHtml(post.description)}</p>`
    : '';
  const cta = post.kind === 'analysis' ? 'Read analysis' : 'Read essay';

  return `
    <a href="${escapeHtml(post.link)}" target="_blank" rel="noopener" class="writing-preview">
      <div class="writing-preview-meta">
        <span>${escapeHtml(post.category || '')}</span>
        <time datetime="${escapeHtml(post.date)}">${formatMonth(post.date)}</time>
      </div>
      <h2>${escapeHtml(post.title)}</h2>
      ${description}
      <span class="work-preview-cta">${cta} ↗</span>
    </a>
  `;
}

function formatMonth(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
