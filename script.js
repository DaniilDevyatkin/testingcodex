// Глобальные переменные
let socket;
let roomId = null;
let player = null;
let currentPlayerTime = 0;

// DOM элементы
const roomSection = document.querySelector('.room-section');
const videoSection = document.querySelector('.video-section');
const chatSection = document.querySelector('.chat-section');

const roomIdInput = document.getElementById('room-id');
const joinRoomBtn = document.getElementById('join-room-btn');
const createRoomBtn = document.getElementById('create-room-btn');
const currentRoomDiv = document.getElementById('current-room');
const roomDisplaySpan = document.getElementById('room-display');
const leaveRoomBtn = document.getElementById('leave-room-btn');

const videoUrlInput = document.getElementById('video-url');
const loadVideoBtn = document.getElementById('load-video-btn');
const playerPlaceholder = document.getElementById('player-placeholder');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const syncBtn = document.getElementById('sync-btn');

const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Отключаем элементы управления видео и чатом до подключения к комнате
    disableVideoControls();
    disableChat();

    // Обработчики кнопок комнаты
    createRoomBtn.addEventListener('click', createRoom);
    joinRoomBtn.addEventListener('click', joinRoom);
    leaveRoomBtn.addEventListener('click', leaveRoom);

    // Обработчики кнопок видео
    loadVideoBtn.addEventListener('click', loadVideo);
    playBtn.addEventListener('click', playVideo);
    pauseBtn.addEventListener('click', pauseVideo);
    syncBtn.addEventListener('click', syncVideo);

    // Обработчики чата
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

// Функция создания комнаты
function createRoom() {
    const newRoomId = generateRoomId();
    connectToSocket(newRoomId);
}

// Функция присоединения к комнате
function joinRoom() {
    const enteredRoomId = roomIdInput.value.trim();
    if (!enteredRoomId) {
        alert('Пожалуйста, введите ID комнаты');
        return;
    }
    connectToSocket(enteredRoomId);
}

// Подключение к сокету
function connectToSocket(roomIdParam) {
    if (socket) {
        socket.disconnect();
    }

    // Подключение к локальному серверу (в продакшене заменить на реальный адрес)
    socket = io('http://localhost:3000'); // Предполагается, что сервер запущен на этом адресе
    
    socket.on('connect', () => {
        socket.emit('join_room', { roomId: roomIdParam });
        console.log(`Подключен к комнате: ${roomIdParam}`);
        
        // Устанавливаем ID комнаты и показываем информацию о комнате
        roomId = roomIdParam;
        roomDisplaySpan.textContent = roomId;
        currentRoomDiv.style.display = 'flex';
        
        // Активируем элементы управления видео и чатом
        enableVideoControls();
        enableChat();
        
        // Показываем уведомление
        showMessage('Вы присоединились к комнате', 'system');
    });

    socket.on('disconnect', () => {
        console.log('Отключен от сервера');
        showMessage('Вы были отключены от сервера', 'system');
        resetUI();
    });

    socket.on('user_joined', (data) => {
        showMessage(`${data.username || 'Пользователь'} присоединился к комнате`, 'system');
    });

    socket.on('user_left', (data) => {
        showMessage(`${data.username || 'Пользователь'} покинул комнату`, 'system');
    });

    socket.on('video_loaded', (data) => {
        loadPlayer(data.videoUrl);
    });

    socket.on('video_play', () => {
        if (player) {
            player.playVideo();
        }
    });

    socket.on('video_pause', () => {
        if (player) {
            player.pauseVideo();
        }
    });

    socket.on('video_sync', (data) => {
        if (player) {
            player.seekTo(data.time, true);
            if (data.isPlaying) {
                player.playVideo();
            } else {
                player.pauseVideo();
            }
        }
    });

    socket.on('chat_message', (data) => {
        displayMessage(data.username, data.message);
    });
}

// Функция генерации ID комнаты
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Загрузка видео
function loadVideo() {
    const videoUrl = videoUrlInput.value.trim();
    if (!videoUrl) {
        alert('Пожалуйста, введите ссылку на видео');
        return;
    }

    // Отправляем URL видео на сервер, чтобы все пользователи в комнате могли его увидеть
    if (socket && socket.connected) {
        socket.emit('load_video', { roomId, videoUrl });
    }
}

// Загрузка плеера
function loadPlayer(videoUrl) {
    // Определяем тип видео по URL
    if (isYouTubeUrl(videoUrl)) {
        loadYouTubePlayer(videoUrl);
    } else {
        // Для других платформ можно добавить соответствующую логику
        playerPlaceholder.innerHTML = '<p>Поддержка других платформ в разработке</p>';
    }
}

// Проверка, является ли URL YouTube ссылкой
function isYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
}

// Извлечение ID видео из YouTube URL
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Загрузка YouTube плеера
function loadYouTubePlayer(videoUrl) {
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
        playerPlaceholder.innerHTML = '<p>Невозможно извлечь ID видео из URL</p>';
        return;
    }

    // Очищаем контейнер плеера
    playerPlaceholder.innerHTML = '<div id="youtube-player"></div>';

    // Создаем плеер после загрузки YouTube API
    if (typeof YT !== 'undefined' && YT.Player) {
        initializeYouTubePlayer(videoId);
    } else {
        // Если API еще не загружен, ждем события onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = function() {
            initializeYouTubePlayer(videoId);
        };
    }
}

// Инициализация YouTube плеера
function initializeYouTubePlayer(videoId) {
    player = new YT.Player('youtube-player', {
        height: '400',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Обработчик готовности плеера
function onPlayerReady(event) {
    console.log('YouTube плеер готов');
    // Активируем кнопки управления
    playBtn.disabled = false;
    pauseBtn.disabled = false;
    syncBtn.disabled = false;
}

// Обработчик изменения состояния плеера
function onPlayerStateChange(event) {
    // При необходимости можно добавить дополнительную логику
}

// Воспроизведение видео
function playVideo() {
    if (player && socket && socket.connected) {
        player.playVideo();
        socket.emit('video_play', { roomId });
    }
}

// Пауза видео
function pauseVideo() {
    if (player && socket && socket.connected) {
        player.pauseVideo();
        socket.emit('video_pause', { roomId });
    }
}

// Синхронизация видео
function syncVideo() {
    if (player && socket && socket.connected) {
        const currentTime = player.getCurrentTime();
        const isPlaying = player.getPlayerState() === YT.PlayerState.PLAYING;
        
        socket.emit('video_sync', {
            roomId,
            time: currentTime,
            isPlaying
        });
    }
}

// Отправка сообщения в чат
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    if (socket && socket.connected) {
        socket.emit('chat_message', {
            roomId,
            message,
            username: getUserName()
        });
        
        messageInput.value = '';
    }
}

// Отображение сообщения в чате
function displayMessage(username, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    
    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('username');
    usernameSpan.textContent = `${username}: `;
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    messageElement.appendChild(usernameSpan);
    messageElement.appendChild(messageSpan);
    chatMessages.appendChild(messageElement);
    
    // Прокручиваем вниз
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Показ системного сообщения
function showMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    messageSpan.style.color = '#ff9800'; // Цвет для системных сообщений
    
    messageElement.appendChild(messageSpan);
    chatMessages.appendChild(messageElement);
    
    // Прокручиваем вниз
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Получение имени пользователя (в реальной реализации может быть авторизация)
function getUserName() {
    return localStorage.getItem('username') || 'Аноним';
}

// Активация элементов управления видео
function enableVideoControls() {
    videoUrlInput.disabled = false;
    loadVideoBtn.disabled = false;
    playBtn.disabled = false;
    pauseBtn.disabled = false;
    syncBtn.disabled = false;
}

// Деактивация элементов управления видео
function disableVideoControls() {
    videoUrlInput.disabled = true;
    loadVideoBtn.disabled = true;
    playBtn.disabled = true;
    pauseBtn.disabled = true;
    syncBtn.disabled = true;
}

// Активация чата
function enableChat() {
    messageInput.disabled = false;
    sendMessageBtn.disabled = false;
}

// Деактивация чата
function disableChat() {
    messageInput.disabled = true;
    sendMessageBtn.disabled = true;
}

// Сброс UI при выходе из комнаты
function resetUI() {
    roomId = null;
    currentRoomDiv.style.display = 'none';
    
    disableVideoControls();
    disableChat();
    
    // Очищаем контейнер плеера
    playerPlaceholder.innerHTML = '<p>Видео будет отображаться здесь после загрузки</p>';
    
    // Очищаем чат
    chatMessages.innerHTML = '';
    
    // Сбрасываем поля ввода
    videoUrlInput.value = '';
    messageInput.value = '';
}

// Покидание комнаты
function leaveRoom() {
    if (socket && socket.connected) {
        socket.emit('leave_room', { roomId });
        socket.disconnect();
        resetUI();
    }
}