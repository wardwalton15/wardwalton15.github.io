# Copilot Instructions for wardwalton15.github.io

## Project Overview
A personal portfolio website for Ward Walton, a data professional. It's a **static HTML/CSS/JavaScript site** with dynamic content loading via JSON files. No backend, no build system—just vanilla web standards.

## Architecture Pattern: JSON + Fetch + DOM Rendering

The site uses a consistent pattern for **dynamic content pages** (Projects & Writing):

1. **HTML page** provides the container (e.g., `<div id="projects-grid">`)
2. **JavaScript file** fetches JSON data and renders cards into that container
3. **JSON file** defines the content structure (title, description, thumbnail, link)

**Example flow:**
- `projects.html` → calls `scripts/projects.js` → fetches `data/projects.json` → renders `.card` elements into `#projects-grid`

This pattern must be **replicated exactly** when adding new dynamic content sections.

## Key Files & Responsibilities

| File | Purpose |
|------|---------|
| `index.html` | About page with inline styles (uses Inter font, blue accent color) |
| `style.css` | Shared styles for dynamic pages (card grid, header, nav) |
| `scripts/{projects,writing}.js` | Fetch JSON and render card grids using `.innerHTML` |
| `data/{projects,writing}.json` | Content structure with `title`, `description`, `thumb`, `link` fields |
| `*.html` static pages | Resume (iframe PDF), individual project/writing detail pages |

## CSS Conventions

- **Header**: Sticky blue bar (#58a6f5) with centered nav
- **Cards**: White background, border-radius 8px, hover lift effect (`transform: translateY(-4px)`)
- **Responsive**: Grid uses `repeat(auto-fill, minmax(280px, 1fr))` for mobile-friendly layouts
- **Colors**: Blue #58a6f5 (header), light blue #dbe4ee (body bg), white #fff (cards)

## JavaScript Patterns

All JS files follow the same pattern. Do not deviate:
```javascript
fetch('data/filename.json')
  .then(response => response.json())
  .then(items => {
    const container = document.getElementById('container-id');
    items.forEach(item => {
      const card = document.createElement('a');
      card.href = item.link;
      card.className = 'card';
      card.innerHTML = `<img src="${item.thumb}"><h2>${item.title}</h2><p>${item.description}</p>`;
      container.appendChild(card);
    });
  })
  .catch(err => console.error('Error loading data:', err));
```

## Important Constraints

1. **No CSS frameworks** - Pure CSS with vendor-agnostic approach
2. **No npm/build tools** - Vanilla JS, no bundlers or preprocessors
3. **No CSS-in-JS** - Use inline styles only in specific cases (e.g., `index.html` uses `<style>` tags)
4. **Image paths**: Relative paths like `images/project1-thumb.jpg` (case matters)
5. **JSON structure**: Must include exactly `title`, `description`, `thumb`, `link` fields for card rendering

## Navigation Structure

All pages include identical nav bar:
```html
<a href="index.html">About</a>
<a href="resume.html">Resume</a>
<a href="projects.html">Projects</a>
<a href="writing.html">Writing</a>
```
Always verify nav completeness and links when creating/modifying pages.

## Adding New Content

To add a new dynamic section (e.g., "Gallery"):
1. Create `gallery.html` with `<div id="gallery-grid" class="card-grid"></div>` and `<script src="scripts/gallery.js"></script>`
2. Create `scripts/gallery.js` using the standard fetch pattern (see JS Patterns above)
3. Create `data/gallery.json` with array of objects: `[{title, description, thumb, link}, ...]`
4. Add navigation link to all `.html` files

## No Special Tooling Required

- Just edit HTML/CSS/JS files directly in the editor
- Use browser's DevTools to test responsive design
- Static site hosted via GitHub Pages—no deployment complexity
- All development is file-based; no localhost server needed for most changes
