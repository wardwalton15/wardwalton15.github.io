fetch('data/projects.json')
  .then(response => response.json())
  .then(projects => {
    const container = document.getElementById('projects-grid');
    projects.forEach(proj => {
      const card = document.createElement('a');
      card.href = proj.link;
      card.className = 'card';
      card.innerHTML = `
        <img src="${proj.thumb}" alt="${proj.title}">
        <h2>${proj.title}</h2>
        <p>${proj.description}</p>
      `;
      container.appendChild(card);
    });
  })
  .catch(err => console.error('Error loading projects:', err));
