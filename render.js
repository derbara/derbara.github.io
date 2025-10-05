window.addEventListener('DOMContentLoaded', () => {
  // Находим контейнеры для карточек
  const sections = {
    soup: document.querySelector('section:nth-of-type(1) .menu-grid'),
    main: document.querySelector('section:nth-of-type(2) .menu-grid'),
    drink: document.querySelector('section:nth-of-type(3) .menu-grid')
  };

  // Создаём блок для отображения заказа
  const orderBlock = document.querySelector('.form-block h3');
  const orderDisplay = document.createElement('div');
  orderDisplay.className = 'order-summary';
  orderBlock.insertAdjacentElement('afterend', orderDisplay);

  // Создаём блок для итоговой стоимости
  const totalDisplay = document.createElement('p');
  totalDisplay.className = 'total-price';
  orderDisplay.insertAdjacentElement('afterend', totalDisplay);

  // Хранилище выбранных блюд
  const selected = { soup: null, main: null, drink: null };

  // Функция обновления блока заказа
  function updateOrderDisplay() {
    const hasSelection = Object.values(selected).some(Boolean);
    orderDisplay.innerHTML = '';

    if (!hasSelection) {
      orderDisplay.textContent = 'Ничего не выбрано';
      totalDisplay.textContent = '';
      return;
    }

    const labels = {
      soup: 'Суп',
      main: 'Главное блюдо',
      drink: 'Напиток'
    };

    for (const category of ['soup', 'main', 'drink']) { //Перебор категорий и отображение заказа
      const item = selected[category]; //Получаем выбранное блюдо из объекта selected по текущей категории.
      const block = document.createElement('div'); //Создаём новый HTML-элемент <div>, который будет отображать одно блюдо.
      block.className = 'order-item'; //стилизация

      if (item) {
        block.innerHTML = `<strong>${labels[category]}</strong><br>${item.name} ${item.price}₽`;
      } else {
        block.innerHTML = `<strong>${labels[category]}</strong><br>${labels[category]} не выбран`;
      }

      orderDisplay.appendChild(block);
    }

    let total = 0; //хранит сумму заказа
    for (const item of Object.values(selected)) {
      if (item) total += item.price;
    }
    totalDisplay.textContent = `Итоговая стоимость: ${total} ₽`; //итоговую суммa
  }

  // Функция создания карточки блюда
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
      selected[item.category] = item;
      updateOrderDisplay();
    });

    return card;
  }

  // Сортировка и отображение карточек
  const sortedItems = menuItems.slice().sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  sortedItems.forEach(item => {
    const card = createCard(item);
    sections[item.category].appendChild(card);
  });
  updateOrderDisplay(); // Показывает "Ничего не выбрано" при загрузке

});
