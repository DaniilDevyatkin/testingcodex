document.addEventListener('DOMContentLoaded', async function() {
  const cartItemsDiv = document.getElementById('cart-items');
  const clearCartBtn = document.getElementById('clear-cart');

  // Загружаем товары из хранилища
  const { cartItems } = await chrome.storage.sync.get('cartItems');
  const items = cartItems || [];

  // Отображаем товары в корзине
  if (items.length === 0) {
    cartItemsDiv.innerHTML = '<div class="empty-cart">Корзина пуста</div>';
  } else {
    cartItemsDiv.innerHTML = '';
    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';
      itemDiv.innerHTML = `
        <div class="item-title">${item.title}</div>
        <div class="item-price">${item.price}</div>
        <div class="item-marketplace">Маркетплейс: ${item.marketplace}</div>
        <a href="${item.url}" target="_blank" class="item-link">${item.url}</a>
      `;
      cartItemsDiv.appendChild(itemDiv);
    });
  }

  // Обработчик кнопки очистки корзины
  clearCartBtn.addEventListener('click', async function() {
    await chrome.storage.sync.clear();
    cartItemsDiv.innerHTML = '<div class="empty-cart">Корзина пуста</div>';
  });
});