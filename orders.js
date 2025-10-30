const API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api';
const API_KEY = '50c41ef5-a738-4f61-869e-0fa04dc0d8db';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.orders-container');
  const dishes = await loadDishes();

  const dishMap = Object.fromEntries(dishes.map(d => [d.id, d.name]));
  const dishPriceMap = Object.fromEntries(dishes.map(d => [d.id, d]));

  try {
    const response = await fetch(`${API_URL}/orders?api_key=${API_KEY}`);
    if (!response.ok) throw new Error('Ошибка загрузки заказов');
    const orders = await response.json();

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    orders.forEach((order, index) => {
      const items = [
        order.soup_id,
        order.main_course_id,
        order.salad_id,
        order.drink_id,
        order.dessert_id
      ].filter(Boolean).map(id => dishMap[id]).filter(Boolean);

      const delivery = order.delivery_type === 'by_time'
        ? order.delivery_time
        : 'Как можно скорее (с 7:00 до 23:00)';

      const total = order.total_price ?? calculateTotal(order, dishPriceMap);

      const card = document.createElement('div');
      card.className = 'order-card';
      card.innerHTML = `
        <p><strong>№ ${index + 1}</strong></p>
        <p>Дата оформления: ${formatDate(order.created_at)}</p>
        <p>Состав заказа: ${items.join(', ')}</p>
        <p>Стоимость: ${total} ₽</p>
        <p>Время доставки: ${delivery}</p>
        <div class="actions">
          <button class="view" data-id="${order.id}">Подробнее</button>
          <button class="edit" data-id="${order.id}">Редактировать</button>
          <button class="delete" data-id="${order.id}">Удалить</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    showNotification('Не удалось загрузить заказы');
  }

  container.addEventListener('click', async e => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('view')) {
      const order = await fetchOrder(id);
      openViewModal(order, dishMap, dishPriceMap);
    }

    if (e.target.classList.contains('edit')) {
      const order = await fetchOrder(id);
      openEditModal(order);
    }

    if (e.target.classList.contains('delete')) {
      openDeleteModal(id);
    }
  });
});

function calculateTotal(order, dishPriceMap) {
  const ids = [
    order.soup_id,
    order.main_course_id,
    order.salad_id,
    order.drink_id,
    order.dessert_id
  ].filter(Boolean);

  return ids.reduce((sum, id) => {
    const dish = dishPriceMap[id];
    return sum + (dish?.price || 0);
  }, 0);
}

async function loadDishes() {
  try {
    const res = await fetch(`${API_URL}/dishes?api_key=${API_KEY}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    showNotification('Ошибка загрузки меню');
    return [];
  }
}

async function fetchOrder(id) {
  const res = await fetch(`${API_URL}/orders/${id}?api_key=${API_KEY}`);
  if (!res.ok) throw new Error('Ошибка загрузки заказа');
  return await res.json();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function showNotification(message) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const note = document.createElement('div');
  note.className = 'notification';
  note.innerHTML = `<p>${message}</p><button>Ок 👌</button>`;
  document.body.appendChild(note);
  note.querySelector('button').addEventListener('click', () => note.remove());
}

function openViewModal(order, dishMap, dishPriceMap) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  const total = order.total_price ?? calculateTotal(order, dishPriceMap);

  modal.innerHTML = `
    <span class="close">&times;</span>
    <h3>Просмотр заказа</h3>
    <div class="modal-content">
      <p><strong>Дата оформления:</strong> ${formatDate(order.created_at)}</p>
      <p><strong>Имя:</strong> ${order.full_name}</p>
      <p><strong>Адрес:</strong> ${order.delivery_address}</p>
      <p><strong>Телефон:</strong> ${order.phone}</p>
      <p><strong>Email:</strong> ${order.email}</p>
      <p><strong>Комментарий:</strong> ${order.comment || '—'}</p>
      <p><strong>Состав:</strong></p>
      <ul>
        ${['soup_id','main_course_id','salad_id','drink_id','dessert_id']
          .map(key => order[key] ? `<li>${dishMap[order[key]]}</li>` : '')
          .join('')}
      </ul>
      <p><strong>Стоимость:</strong> ${total} ₽</p>
    </div>
    <div class="modal-actions">
      <button>Ок</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.close').onclick = () => modal.remove();
  modal.querySelector('button').onclick = () => modal.remove();
}

function openDeleteModal(id) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <span class="close">&times;</span>
    <h3>Удаление заказа</h3>
    <p>Вы уверены, что хотите удалить заказ?</p>
    <div class="modal-actions">
      <button class="cancel">Отмена</button>
      <button class="confirm">Да</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.close').onclick = () => modal.remove();
  modal.querySelector('.cancel').onclick = () => modal.remove();
  modal.querySelector('.confirm').onclick = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}?api_key=${API_KEY}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error();
      modal.remove();
      showNotification('Заказ удалён');
      setTimeout(() => location.reload(), 1000);
    } catch {
      showNotification('Ошибка при удалении заказа');
    }
  };
}

function openEditModal(order) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <span class="close">&times;</span>
    <h3>Редактирование заказа</h3>
    <form id="editForm">
      <label>Имя получателя</label>
      <input type="text" name="full_name" value="${order.full_name}" required>
      <label>Email</label>
      <input type="email" name="email" value="${order.email}" required>
      <label>Телефон</label>
      <input type="tel" name="phone" value="${order.phone}" required>
      <label>Адрес доставки</label>
      <input type="text" name="delivery_address" value="${order.delivery_address}" required>
      <fieldset>
        <legend>Тип доставки</legend>
        <label><input type="radio" name="delivery_type" value="now" ${order.delivery_type === 'now' ? 'checked' : ''}> Как можно скорее</label>
        <label><input type="radio" name="delivery_type" value="by_time" ${order.delivery_type === 'by_time' ? 'checked' : ''}> К указанному времени</label>
      </fieldset>
      <label>Время доставки</label>
      <input type="text" name="delivery_time" value="${order.delivery_time || ''}" placeholder="например, 14:35">
      <label>Комментарий</label>
      <textarea name="comment">${order.comment || ''}</textarea>
      <div class="modal-actions">
        <button type="button" class="cancel">Отмена</button>
        <button type="submit">Сохранить</button>
      </div>
    </form>
  `;

  document.body.appendChild(modal);

  // Обработчик отправки формы
  modal.querySelector('#editForm').addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      delivery_address: formData.get('delivery_address'),
      delivery_type: formData.get('delivery_type'),
      delivery_time: formData.get('delivery_time') || null,
      comment: formData.get('comment') || ''
    };

    if (payload.delivery_type === 'by_time' && !payload.delivery_time) {
      showNotification('Укажите время доставки');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/orders/${order.id}?api_key=${API_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      modal.remove();
      showNotification('Заказ успешно изменён');
      setTimeout(() => location.reload(), 1000);
    } catch {
      showNotification('Ошибка при редактировании заказа');
    }
  });

  // Обработчики закрытия
  modal.querySelector('.close').onclick = () => modal.remove();
  modal.querySelector('.cancel').onclick = () => modal.remove();
}



