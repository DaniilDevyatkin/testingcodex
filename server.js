const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Путь для статических файлов
app.use(express.static(path.join(__dirname)));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Хранилище комнат
const rooms = {};

// Обработка подключений
io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    // Присоединение к комнате
    socket.on('join_room', (data) => {
        const { roomId } = data;
        
        // Присоединяемся к комнате
        socket.join(roomId);
        
        // Создаем комнату если она не существует
        if (!rooms[roomId]) {
            rooms[roomId] = {
                users: [],
                currentVideo: null,
                isPlaying: false,
                currentTime: 0
            };
        }
        
        // Добавляем пользователя в комнату
        rooms[roomId].users.push(socket.id);
        
        // Уведомляем остальных пользователей в комнате
        socket.to(roomId).emit('user_joined', {
            username: `Пользователь_${socket.id.substring(0, 5)}`
        });
        
        console.log(`Пользователь ${socket.id} присоединился к комнате ${roomId}`);
    });

    // Загрузка видео
    socket.on('load_video', (data) => {
        const { roomId, videoUrl } = data;
        
        if (rooms[roomId]) {
            rooms[roomId].currentVideo = videoUrl;
            
            // Рассылаем всем пользователям в комнате новое видео
            io.to(roomId).emit('video_loaded', {
                videoUrl: videoUrl
            });
        }
    });

    // Воспроизведение видео
    socket.on('video_play', (data) => {
        const { roomId } = data;
        
        if (rooms[roomId]) {
            rooms[roomId].isPlaying = true;
            
            // Рассылаем команду воспроизведения всем пользователям в комнате
            socket.to(roomId).emit('video_play');
        }
    });

    // Пауза видео
    socket.on('video_pause', (data) => {
        const { roomId } = data;
        
        if (rooms[roomId]) {
            rooms[roomId].isPlaying = false;
            
            // Рассылаем команду паузы всем пользователям в комнате
            socket.to(roomId).emit('video_pause');
        }
    });

    // Синхронизация видео
    socket.on('video_sync', (data) => {
        const { roomId, time, isPlaying } = data;
        
        if (rooms[roomId]) {
            rooms[roomId].currentTime = time;
            rooms[roomId].isPlaying = isPlaying;
            
            // Рассылаем команду синхронизации всем пользователям в комнате
            socket.to(roomId).emit('video_sync', {
                time: time,
                isPlaying: isPlaying
            });
        }
    });

    // Отправка сообщения в чат
    socket.on('chat_message', (data) => {
        const { roomId, message, username } = data;
        
        if (rooms[roomId]) {
            // Рассылаем сообщение всем пользователям в комнате
            io.to(roomId).emit('chat_message', {
                username: username || `Пользователь_${socket.id.substring(0, 5)}`,
                message: message
            });
        }
    });

    // Покидание комнаты
    socket.on('leave_room', (data) => {
        const { roomId } = data;
        
        if (rooms[roomId]) {
            // Удаляем пользователя из комнаты
            rooms[roomId].users = rooms[roomId].users.filter(user => user !== socket.id);
            
            // Уведомляем остальных пользователей
            socket.to(roomId).emit('user_left', {
                username: `Пользователь_${socket.id.substring(0, 5)}`
            });
            
            // Если в комнате больше нет пользователей, удаляем комнату
            if (rooms[roomId].users.length === 0) {
                delete rooms[roomId];
                console.log(`Комната ${roomId} удалена`);
            } else {
                console.log(`Пользователь ${socket.id} покинул комнату ${roomId}`);
            }
        }
    });

    // Обработка отключения
    socket.on('disconnect', () => {
        console.log('Пользователь отключился:', socket.id);
        
        // Удаляем пользователя из всех комнат
        for (const roomId in rooms) {
            if (rooms[roomId].users.includes(socket.id)) {
                rooms[roomId].users = rooms[roomId].users.filter(user => user !== socket.id);
                
                // Уведомляем остальных пользователей
                socket.to(roomId).emit('user_left', {
                    username: `Пользователь_${socket.id.substring(0, 5)}`
                });
                
                // Если в комнате больше нет пользователей, удаляем комнату
                if (rooms[roomId].users.length === 0) {
                    delete rooms[roomId];
                    console.log(`Комната ${roomId} удалена`);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});