const projectsGrid = document.getElementById('projects-grid');

fetch('data/projects.json?v=20260903')
  .then(response => {
    if (!response.ok) throw new Error(`Project data returned ${response.status}`);
    return response.json();
  })
  .then(projects => {
    const sortedProjects = [...projects].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (b.date || '').localeCompare(a.date || '');
    });
    renderProjects(sortedProjects);
  })
  .catch(error => {
    console.error('Error loading projects:', error);
    if (projectsGrid) {
      projectsGrid.innerHTML = `
        <div class="no-results">
          <h2>Projects are temporarily unavailable.</h2>
          <p>Please refresh the page or try again shortly.</p>
        </div>
      `;
    }
  });

function renderProjects(projects) {
  if (!projectsGrid) return;

  projectsGrid.innerHTML = projects.map(project => {
    const externalIcon = project.type === 'external'
      ? '<i class="fas fa-external-link-alt" aria-hidden="true"></i>'
      : '';
    const featuredBadge = project.featured
      ? '<span class="badge-featured">Featured</span>'
      : '';
    const externalAttributes = project.type === 'external'
      ? 'target="_blank" rel="noopener"'
      : '';
    const projectArt = project.thumb
      ? `<img src="${project.thumb}" alt="" loading="lazy">`
      : `<div class="card-art" aria-hidden="true"><span>${project.category}</span></div>`;
    const projectDate = project.date
      ? `<time class="card-date" datetime="${project.date}">${formatDate(project.date)}</time>`
      : `<span class="card-date">${project.status || 'Ongoing'}</span>`;

    return `
      <a href="${project.link}"
         class="card ${project.featured ? 'featured' : ''}"
         ${externalAttributes}
         aria-label="${project.title}${project.type === 'external' ? ' (opens in a new tab)' : ''}">
        ${projectArt}
        <div class="card-body">
          <div class="card-header">
            ${featuredBadge}
            ${projectDate}
          </div>
          <h2>${project.title} ${externalIcon}</h2>
          <p>${project.description}</p>
          <div class="card-meta">
            <div class="card-tags">
              ${project.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
              ${project.tags.length > 3 ? `<span class="tag">+${project.tags.length - 3}</span>` : ''}
            </div>
            <div class="tech-stack">${project.tools.join(' • ')}</div>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
}
