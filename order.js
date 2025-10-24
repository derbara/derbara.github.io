const API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api';
const API_KEY = '50c41ef5-a738-4f61-869e-0fa04dc0d8db';

document.addEventListener('DOMContentLoaded', async () => {
  const selectedIds = JSON.parse(localStorage.getItem('order')) || {};
  const orderItemsContainer = document.querySelector('.order-items');
  const summaryContainer = document.querySelector('.order-summary');
  const totalDisplay = document.querySelector('.total-price');
  const emptyMessage = document.querySelector('.empty-message');

  const labels = {
    soup: 'Суп',
    'main-course': 'Главное блюдо',
    salad: 'Салат',
    drink: 'Напиток',
    dessert: 'Десерт'
  };

  let allDishes = [];

  try {
    const response = await fetch(`${API_URL}/dishes?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Ошибка загрузки блюд');
    allDishes = await response.json();
  } catch (error) {
    console.error(error);
    emptyMessage.textContent = 'Ошибка загрузки меню. Попробуйте позже.';
    emptyMessage.style.display = 'block';
    return;
  }

  const categories = ['soup', 'main-course', 'salad', 'drink', 'dessert'];
  let total = 0;

  categories.forEach(cat => {
    const dishId = selectedIds[cat];
    const dish = allDishes.find(d => d.id === dishId);

    const card = document.createElement('div');
    card.className = 'card';

    if (dish) {
      card.innerHTML = `
        <img src="${dish.image}" alt="${dish.name}">
        <div class="info">
          <p class="price">${dish.price} ₽</p>
          <p class="name">${dish.name}</p>
          <p class="weight">${dish.count}</p>
        </div>
        <button data-cat="${cat}">Удалить</button>
      `;
      total += dish.price;
    } else {
      card.innerHTML = `<p>${labels[cat]}: Не выбрано</p>`;
    }

    orderItemsContainer.appendChild(card);

    const line = document.createElement('div');
    line.className = 'order-line';
    line.textContent = dish
      ? `${labels[cat]}: ${dish.name} ${dish.price}₽`
      : `${labels[cat]}: Не выбран`;
    summaryContainer.appendChild(line);
  });

  totalDisplay.textContent = `Итоговая стоимость: ${total} ₽`;

  if (Object.keys(selectedIds).length === 0) {
    emptyMessage.style.display = 'block';
  }

  // Удаление блюда
  orderItemsContainer.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      const cat = e.target.dataset.cat;
      delete selectedIds[cat];
      localStorage.setItem('order', JSON.stringify(selectedIds));
      location.reload();
    }
  });

  // Отправка формы
  document.querySelector('#orderForm').addEventListener('submit', async e => {
    e.preventDefault();

    const message = getMissingMessage(selectedIds);
    if (message) {
      showNotification(message);
      return;
    }

    const formData = new FormData(e.target);
    const payload = {
      full_name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      delivery_address: formData.get('address'),
      delivery_type: formData.get('delivery_time_choice'),
      delivery_time: formData.get('delivery_time') || null,
      comment: formData.get('comments') || '',
      subscribe: formData.get('subscribe') ? 1 : 0,
      soup_id: selectedIds.soup || null,
      main_course_id: selectedIds['main-course'] || null,
      salad_id: selectedIds.salad || null,
      drink_id: selectedIds.drink || null,
      dessert_id: selectedIds.dessert || null
    };

    try {
      const response = await fetch(`${API_URL}/orders?api_key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Ошибка при оформлении заказа');

      showNotification('Заказ успешно оформлен!');
      localStorage.removeItem('order');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    } catch (error) {
      console.error(error);
      showNotification('Не удалось оформить заказ. Попробуйте позже.');
    }
  });
});

// Диагностика недостающих категорий
function getMissingMessage(order) {
  const hasSoup = 'soup' in order;
  const hasMain = 'main-course' in order;
  const hasSalad = 'salad' in order;
  const hasDrink = 'drink' in order;
  const hasDessert = 'dessert' in order;

  const totalSelected = Object.keys(order).length;

  if (totalSelected === 0) return 'Ничего не выбрано. Выберите блюда для заказа';
  if (!hasDrink) return 'Выберите напиток';
  if (hasSoup && !hasMain && !hasSalad) return 'Выберите главное блюдо/салат/стартер';
  if (hasSalad && !hasSoup && !hasMain) return 'Выберите суп или главное блюдо';
  if ((hasDrink || hasDessert) && !hasMain && !hasSoup) return 'Выберите главное блюдо';

  return null; // Комбо допустимо
}

// Уведомление
function showNotification(message) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'notification';

  overlay.innerHTML = `
    <p>${message}</p>
    <button>Окей 👌</button>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('button').addEventListener('click', () => {
    overlay.remove();
  });
}
