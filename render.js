window.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api/dishes';
  const API_KEY = '50c41ef5-a738-4f61-869e-0fa04dc0d8db';

  const sections = {
    soup: document.querySelector('[data-category="soup"]'),
    main: document.querySelector('[data-category="main"]'),
    starter: document.querySelector('[data-category="starter"]'),
    drink: document.querySelector('[data-category="drink"]'),
    dessert: document.querySelector('[data-category="dessert"]')
  };

  const checkoutPanel = document.querySelector('.checkout-panel');
  const checkoutLink = checkoutPanel?.querySelector('.checkout-link');
  const totalDisplay = checkoutPanel?.querySelector('.total-price');

  const selected = {
    soup: [],
    main: [],
    starter: [],
    drink: [],
    dessert: []
  };

  function saveToStorage() {
    const ids = {};
    for (const cat in selected) {
      if (selected[cat][0]) ids[cat] = selected[cat][0].id;
    }
    localStorage.setItem('order', JSON.stringify(ids));
  }

  function loadFromStorage(allDishes) {
    const raw = localStorage.getItem('order');
    if (!raw) return;
    const ids = JSON.parse(raw);
    for (const cat in ids) {
      const dish = allDishes.find(d => d.id === ids[cat]);
      if (dish) selected[cat].push(dish);
    }
  }

  function validateCombo(selected) {
    const hasSoup = selected.soup.length > 0;
    const hasMain = selected.main.length > 0;
    const hasStarter = selected.starter.length > 0;
    const hasDrink = selected.drink.length > 0;

    return (
      (hasSoup && hasMain && hasStarter && hasDrink) ||
      (hasSoup && hasMain && hasDrink) ||
      (hasSoup && hasStarter && hasDrink) ||
      (hasMain && hasStarter && hasDrink) ||
      (hasMain && hasDrink)
    );
  }

  function updateCheckoutPanel() {
    const total = Object.values(selected).flat().reduce((sum, item) => sum + item.price, 0);
    const hasItems = Object.values(selected).some(arr => arr.length > 0);
    const validCombo = validateCombo(selected);

    if (checkoutPanel) {
      checkoutPanel.style.display = hasItems ? 'block' : 'none';
      totalDisplay.textContent = `${total} ₽`;
      checkoutLink.classList.toggle('disabled', !validCombo);
    }
  }

  function createCard(item) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-dish', item.keyword);

    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="info">
        <p class="price">${item.price} ₽</p>
        <p class="name">${item.name}</p>
        <p class="weight">${item.count}</p>
      </div>
      <button>Добавить</button>
    `;

    card.querySelector('button').addEventListener('click', () => {
      selected[item.category] = [item];
      saveToStorage();
      updateCheckoutPanel();
    });

    return card;
  }

  function renderAll(category, grid, menuItems) {
    grid.innerHTML = '';
    menuItems
      .filter(item => item.category === category)
      .forEach(item => grid.appendChild(createCard(item)));
  }

  function renderFiltered(category, kind, grid, menuItems) {
    grid.innerHTML = '';
    menuItems
      .filter(item => item.category === category && item.kind === kind)
      .forEach(item => grid.appendChild(createCard(item)));
  }

  async function loadDishes() {
    try {
      const response = await fetch(`${API_URL}?api_key=${API_KEY}`);
      if (!response.ok) throw new Error('Ошибка загрузки данных');
      return await response.json();
    } catch (error) {
      console.error('Ошибка при загрузке блюд:', error);
      showNotification('Не удалось загрузить меню. Попробуйте позже.');
      return [];
    }
  }

  loadDishes().then(menuItems => {
    loadFromStorage(menuItems);

    Object.entries(sections).forEach(([cat, grid]) => {
      renderAll(cat, grid, menuItems);
    });

    document.querySelectorAll('.filters').forEach(filterBlock => {
      const buttons = filterBlock.querySelectorAll('button');
      const grid = filterBlock.nextElementSibling;
      const category = grid.dataset.category;

      buttons.forEach(button => {
        button.addEventListener('click', () => {
          const kind = button.dataset.kind;

          if (button.classList.contains('active')) {
            button.classList.remove('active');
            renderAll(category, grid, menuItems);
          } else {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderFiltered(category, kind, grid, menuItems);
          }
        });
      });
    });

    updateCheckoutPanel();
  });

  function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'notification';

    overlay.innerHTML = `
      <div class="notification-content">
        <p>${message}</p>
        <button>Окей 👌</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('button').addEventListener('click', () => overlay.remove());
  }
});


