window.addEventListener('DOMContentLoaded', () => {
  const sections = {
    soup: document.querySelector('[data-category="soup"]'),
    'main-course': document.querySelector('[data-category="main-course"]'),
    salad: document.querySelector('[data-category="salad"]'),
    drink: document.querySelector('[data-category="drink"]'),
    dessert: document.querySelector('[data-category="dessert"]')
  };

  const orderBlock = document.querySelector('.form-block h3');
  const orderDisplay = document.createElement('div');
  orderDisplay.className = 'order-summary';
  orderBlock.insertAdjacentElement('afterend', orderDisplay);

  const totalDisplay = document.createElement('p');
  totalDisplay.className = 'total-price';
  orderDisplay.insertAdjacentElement('afterend', totalDisplay);

  const selected = {
    soup: [],
    'main-course': [],
    salad: [],
    drink: [],
    dessert: []
  };

  function updateOrderDisplay() {
    const hasSelection = Object.values(selected).some(arr => arr.length > 0);
    orderDisplay.innerHTML = '';

    if (!hasSelection) {
      orderDisplay.textContent = 'Ничего не выбрано';
      totalDisplay.textContent = '';
      return;
    }

    const labels = {
      soup: 'Суп',
      'main-course': 'Главное блюдо',
      salad: 'Салат/Стартер',
      drink: 'Напиток',
      dessert: 'Десерт'
    };

    for (const category of Object.keys(selected)) {
      const items = selected[category];
      const block = document.createElement('div');
      block.className = 'order-item';
      block.innerHTML = `<strong>${labels[category]}</strong><br>`;

      if (items.length > 0) {
        items.forEach((item, index) => {
          const line = document.createElement('div');
          line.className = 'order-line';
          line.innerHTML = `${item.name} ${item.price}₽ <button class="remove-btn">Удалить</button>`;

          line.querySelector('button').addEventListener('click', () => {
            selected[category].splice(index, 1);
            updateOrderDisplay();
          });

          block.appendChild(line);
        });
      } else {
        block.innerHTML += `${labels[category]} не выбран`;
      }

      orderDisplay.appendChild(block);
    }

    let total = 0;
    for (const items of Object.values(selected)) {
      items.forEach(item => total += item.price);
    }
    totalDisplay.textContent = `Итоговая стоимость: ${total} ₽`;
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

    card.addEventListener('click', () => {
      selected[item.category].push(item);
      updateOrderDisplay();
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
      const response = await fetch('dishes.json');
      if (!response.ok) throw new Error('Ошибка загрузки данных');
      return await response.json();
    } catch (error) {
      console.error('Ошибка при загрузке блюд:', error);
      showNotification('Не удалось загрузить меню. Попробуйте позже.');
      return [];
    }
  }

  loadDishes().then(menuItems => {
    Object.entries(sections).forEach(([category, grid]) => {
      renderAll(category, grid, menuItems);
    });

    document.querySelectorAll('.filters').forEach(filterBlock => {
      const buttons = filterBlock.querySelectorAll('button');
      const grid = filterBlock.parentElement.querySelector('.menu-grid');
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
  });

  document.querySelector('form').addEventListener('submit', e => {
    const counts = {
      soup: selected.soup.length,
      main: selected['main-course'].length,
      starter: selected.salad.length,
      drink: selected.drink.length,
      dessert: selected.dessert.length
    };

    const totalSelected = Object.values(counts).reduce((sum, val) => sum + val, 0);

    if (totalSelected === 0) {
      e.preventDefault();
      showNotification('Ничего не выбрано. Выберите блюда для заказа');
      return;
    }

    if (counts.drink === 0) {
      e.preventDefault();
      showNotification('Выберите напиток');
      return;
    }

    const validCombo =
      (counts.soup && counts.main && counts.starter && counts.drink) || // вариант 1
      (counts.soup && counts.main && counts.drink) ||                   // вариант 2
      (counts.soup && counts.starter && counts.drink) ||                // вариант 3
      (counts.main && counts.starter && counts.drink) ||                // вариант 4
      (counts.main && counts.drink);                                    // вариант 5

    if (!validCombo) {
      if (counts.soup > 0 && counts.main === 0 && counts.starter === 0) {
        e.preventDefault();
        showNotification('Выберите главное блюдо/салат/стартер');
        return;
      }

      if (counts.starter > 0 && counts.soup === 0 && counts.main === 0) {
        e.preventDefault();
        showNotification('Выберите суп или главное блюдо');
        return;
      }

      if ((counts.drink > 0 || counts.dessert > 0) && counts.main === 0 && counts.soup === 0 && counts.starter === 0) {
        e.preventDefault();
        showNotification('Выберите главное блюдо');
        return;
      }

      e.preventDefault();
      showNotification('Комбинация блюд недопустима. Проверьте состав ланча');
      return;
    }
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

    const button = overlay.querySelector('button');
    button.addEventListener('click', () => overlay.remove());
  }

  updateOrderDisplay();
});

