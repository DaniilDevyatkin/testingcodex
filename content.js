// Определяем маркетплейс по URL
function getMarketplace() {
  const url = window.location.href;
  
  if (url.includes('ozon.ru')) {
    return 'Ozon';
  } else if (url.includes('wildberries.ru')) {
    return 'Wildberries';
  } else if (url.includes('market.yandex.ru')) {
    return 'Yandex Market';
  }
  
  return 'Unknown';
}

// Получаем название товара
function getTitle() {
  // Для Ozon
  if (window.location.href.includes('ozon.ru')) {
    const titleElement = document.querySelector('[data-auto="header-title"]');
    if (titleElement) {
      return titleElement.textContent.trim();
    }
  }
  
  // Для Wildberries
  if (window.location.href.includes('wildberries.ru')) {
    const titleElement = document.querySelector('.product-page__header');
    if (titleElement) {
      return titleElement.textContent.trim();
    }
  }
  
  // Для Yandex Market
  if (window.location.href.includes('market.yandex.ru')) {
    const titleElement = document.querySelector('[data-zone-name="title"]');
    if (titleElement) {
      return titleElement.textContent.trim();
    }
  }
  
  // Общий селектор для заголовков
  const generalTitleSelectors = [
    'h1',
    '[class*="title"]',
    '[class*="name"]',
    '[data-testid*="title"]'
  ];
  
  for (const selector of generalTitleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  return 'Без названия';
}

// Получаем цену товара
function getPrice() {
  // Для Ozon
  if (window.location.href.includes('ozon.ru')) {
    const priceElement = document.querySelector('[class*="price"] [data-test-id="price"]');
    if (priceElement) {
      return priceElement.textContent.trim();
    }
  }
  
  // Для Wildberries
  if (window.location.href.includes('wildberries.ru')) {
    const priceElement = document.querySelector('.price-block__final-price');
    if (priceElement) {
      return priceElement.textContent.trim();
    }
  }
  
  // Для Yandex Market
  if (window.location.href.includes('market.yandex.ru')) {
    const priceElements = document.querySelectorAll('[data-zone-name="price"] span');
    for (const element of priceElements) {
      if (element.textContent.trim().includes('₽') || !isNaN(parseInt(element.textContent))) {
        return element.textContent.trim();
      }
    }
  }
  
  // Общий селектор для цен
  const generalPriceSelectors = [
    '[class*="price"]',
    '[data-testid*="price"]',
    '[id*="price"]'
  ];
  
  for (const selector of generalPriceSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim().match(/[0-9].*[₽$€¥]/)) {
      return element.textContent.trim();
    }
  }
  
  return 'Цена не указана';
}

// Добавляем кнопку "Добавить в мульти-корзину"
function addButton() {
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'fixed';
  buttonContainer.style.bottom = '20px';
  buttonContainer.style.right = '20px';
  buttonContainer.style.zIndex = '10000';
  
  const button = document.createElement('button');
  button.textContent = 'Добавить в мульти-корзину';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '14px';
  button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  
  button.addEventListener('click', async function() {
    const item = {
      title: getTitle(),
      price: getPrice(),
      marketplace: getMarketplace(),
      url: window.location.href,
      addedAt: new Date().toISOString()
    };
    
    // Получаем текущую корзину
    const { cartItems } = await chrome.storage.sync.get('cartItems');
    const items = cartItems || [];
    
    // Проверяем, не добавлен ли уже этот товар
    const existingItemIndex = items.findIndex(i => i.url === item.url);
    if (existingItemIndex === -1) {
      // Добавляем новый товар
      items.push(item);
      
      // Сохраняем обновленную корзину
      await chrome.storage.sync.set({ cartItems: items });
      
      alert('Товар добавлен в мульти-корзину!');
    } else {
      alert('Этот товар уже добавлен в корзину.');
    }
  });
  
  buttonContainer.appendChild(button);
  document.body.appendChild(buttonContainer);
}

// Добавляем кнопку при полной загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addButton);
} else {
  addButton();
}