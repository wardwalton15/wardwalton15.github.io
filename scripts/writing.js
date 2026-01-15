// Enhanced writing.js with filtering, search, and sorting
let allWriting = [];
let filteredWriting = [];
let currentFilters = {
  search: '',
  tags: new Set(),
  category: 'all',
  sort: 'date-desc'
};

// Fetch and initialize
fetch('data/writing.json')
  .then(response => response.json())
  .then(writing => {
    allWriting = writing;
    filteredWriting = [...writing];
    initializeFilters();
    renderWriting();
  })
  .catch(err => console.error('Error loading writing:', err));

// Initialize filter UI
function initializeFilters() {
  const allTags = new Set();
  const allCategories = new Set();

  allWriting.forEach(post => {
    if (post.tags) post.tags.forEach(tag => allTags.add(tag));
    if (post.category) allCategories.add(post.category);
  });

  const filtersContainer = document.getElementById('filters-container');
  if (!filtersContainer) return;

  filtersContainer.innerHTML = `
    <div class="filters-wrapper">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input type="text" id="search-input" placeholder="Search writing..." aria-label="Search writing" />
      </div>

      <div class="filter-row">
        <div class="filter-group">
          <label for="category-filter">Category:</label>
          <select id="category-filter" aria-label="Filter by category">
            <option value="all">All Categories</option>
            ${[...allCategories].sort().map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label for="sort-filter">Sort by:</label>
          <select id="sort-filter" aria-label="Sort writing">
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
      </div>

      ${allTags.size > 0 ? `
      <div class="filter-group tags-filter">
        <label>Tags:</label>
        <div class="tag-pills">
          ${[...allTags].sort().map(tag => `
            <button class="tag-pill" data-tag="${tag}" aria-label="Filter by ${tag}">${tag}</button>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <button id="clear-filters" class="btn-clear" aria-label="Clear all filters">
        <i class="fas fa-times"></i> Clear Filters
      </button>
    </div>
    <div class="results-header">
      <span id="results-count" aria-live="polite"></span>
    </div>
  `;

  // Attach event listeners
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');
  const clearBtn = document.getElementById('clear-filters');

  if (searchInput) searchInput.addEventListener('input', handleSearch);
  if (categoryFilter) categoryFilter.addEventListener('change', handleCategoryChange);
  if (sortFilter) sortFilter.addEventListener('change', handleSortChange);
  if (clearBtn) clearBtn.addEventListener('click', clearFilters);

  document.querySelectorAll('.tag-pill').forEach(pill => {
    pill.addEventListener('click', handleTagToggle);
  });
}

// Filter handlers
function handleSearch(e) {
  currentFilters.search = e.target.value.toLowerCase();
  applyFilters();
}

function handleCategoryChange(e) {
  currentFilters.category = e.target.value;
  applyFilters();
}

function handleSortChange(e) {
  currentFilters.sort = e.target.value;
  applyFilters();
}

function handleTagToggle(e) {
  const tag = e.target.dataset.tag;
  if (currentFilters.tags.has(tag)) {
    currentFilters.tags.delete(tag);
    e.target.classList.remove('active');
  } else {
    currentFilters.tags.add(tag);
    e.target.classList.add('active');
  }
  applyFilters();
}

function clearFilters() {
  currentFilters = {
    search: '',
    tags: new Set(),
    category: 'all',
    sort: 'date-desc'
  };

  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');

  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = 'all';
  if (sortFilter) sortFilter.value = 'date-desc';

  document.querySelectorAll('.tag-pill').forEach(pill => pill.classList.remove('active'));
  applyFilters();
}

// Apply filters and sort
function applyFilters() {
  filteredWriting = allWriting.filter(post => {
    // Search filter
    if (currentFilters.search) {
      const searchLower = currentFilters.search;
      const matchesSearch =
        post.title.toLowerCase().includes(searchLower) ||
        post.description.toLowerCase().includes(searchLower) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchLower)));
      if (!matchesSearch) return false;
    }

    // Category filter
    if (currentFilters.category !== 'all' && post.category !== currentFilters.category) {
      return false;
    }

    // Tags filter (must match ALL selected tags)
    if (currentFilters.tags.size > 0) {
      const hasAllTags = [...currentFilters.tags].every(tag =>
        post.tags && post.tags.includes(tag)
      );
      if (!hasAllTags) return false;
    }

    return true;
  });

  // Sort
  sortWriting();
  renderWriting();
}

function sortWriting() {
  filteredWriting.sort((a, b) => {
    switch(currentFilters.sort) {
      case 'date-desc':
        return new Date(b.date) - new Date(a.date);
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });
}

// Render writing
function renderWriting() {
  const container = document.getElementById('writing-grid');
  const resultsCount = document.getElementById('results-count');

  if (!container) return;

  // Update results count
  if (resultsCount) {
    resultsCount.textContent = `${filteredWriting.length} ${filteredWriting.length === 1 ? 'article' : 'articles'}`;
  }

  // Show loading state briefly for smooth transition
  container.classList.add('loading');

  setTimeout(() => {
    if (filteredWriting.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>No articles found matching your filters.</p>
          <button onclick="clearFilters()" class="btn-primary">Clear Filters</button>
        </div>
      `;
    } else {
      container.innerHTML = filteredWriting.map(post => {
        const typeIcon = post.type === 'external'
          ? '<i class="fas fa-external-link-alt"></i>'
          : '';
        const featuredBadge = post.featured
          ? '<span class="badge-featured">Featured</span>'
          : '';

        return `
          <a href="${post.link}"
             class="card ${post.featured ? 'featured' : ''}"
             ${post.type === 'external' ? 'target="_blank" rel="noopener"' : ''}
             aria-label="${post.title}">
            <img src="${post.thumb}" alt="${post.title}" loading="lazy">
            <div class="card-body">
              <div class="card-header">
                ${featuredBadge}
                <span class="card-date">${formatDate(post.date)}</span>
              </div>
              <h2>${post.title} ${typeIcon}</h2>
              <p>${post.description}</p>
              ${post.tags && post.tags.length > 0 ? `
              <div class="card-meta">
                <div class="card-tags">
                  ${post.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                  ${post.tags.length > 3 ? `<span class="tag">+${post.tags.length - 3}</span>` : ''}
                </div>
                ${post.tools && post.tools.length > 0 ? `<div class="tech-stack">${post.tools.join(' • ')}</div>` : ''}
              </div>
              ` : ''}
            </div>
          </a>
        `;
      }).join('');
    }

    container.classList.remove('loading');
  }, 150);
}

// Utility function
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Make clearFilters globally accessible
window.clearFilters = clearFilters;
