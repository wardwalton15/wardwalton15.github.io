fetch('data/writing.json')
  .then(response => response.json())
  .then(posts => {
    const container = document.getElementById('writing-grid');
    posts.forEach(post => {
      const card = document.createElement('a');
      card.href = post.link;
      card.className = 'card';
      card.innerHTML = `
        <img src="${post.thumb}" alt="${post.title}">
        <h2>${post.title}</h2>
        <p>${post.description}</p>
      `;
      container.appendChild(card);
    });
  })
  .catch(err => console.error('Error loading writing:', err));
