// Фоновый скрипт для обработки действий расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('Multi-Marketplace Cart расширение установлено');
});

// Обработка сообщений от контент-скриптов
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addItemToCart') {
    // В версии Manifest V3 service worker не может напрямую взаимодействовать с chrome.storage
    // Поэтому сохранение происходит в контент-скрипте через chrome.storage.sync
  }
});