(() => {
  const books = [...document.querySelectorAll('[data-book]')], saved = new Set();
  const search = document.querySelector('#search'), category = document.querySelector('#category'), view = document.querySelector('#saved-view'), count = document.querySelector('#saved-count');
  let savedOnly = false;
  function render() {
    const query = search.value.toLowerCase().trim(); let visible = 0;
    for (const book of books) {
      book.hidden = !((category.value === 'all' || book.dataset.genre === category.value) && book.textContent.toLowerCase().includes(query) && (!savedOnly || saved.has(book.dataset.book)));
      if (!book.hidden) visible++;
      const button = book.querySelector('[data-save]'), selected = saved.has(book.dataset.book);
      button.setAttribute('aria-pressed', String(selected)); button.textContent = `${selected ? 'Unsave' : 'Save'} ${book.querySelector('h2').textContent}`;
    }
    count.textContent = `${saved.size} saved`; document.querySelector('#empty').hidden = visible > 0;
    view.setAttribute('aria-pressed', String(savedOnly)); view.textContent = savedOnly ? 'View all books' : 'View saved books';
  }
  search.addEventListener('input', render); category.addEventListener('change', render);
  view.addEventListener('click', () => { savedOnly = !savedOnly; render(); });
  for (const book of books) book.querySelector('[data-save]').addEventListener('click', () => { const id = book.dataset.book; if (saved.has(id)) saved.delete(id); else saved.add(id); render(); });
  render();
})();
