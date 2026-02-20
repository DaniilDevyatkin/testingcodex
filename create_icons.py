from PIL import Image, ImageDraw
import os

def create_placeholder_icon(size, filename):
    """Создает простую иконку-заглушку с цветным фоном и текстом 'M'"""
    img = Image.new('RGB', (size, size), color=(76, 175, 80))  # Зеленый цвет
    draw = ImageDraw.Draw(img)
    
    # Рисуем рамку
    draw.rectangle([0, 0, size-1, size-1], outline=(0, 0, 0))
    
    # Рисуем крупную букву M в центре
    # Для простоты используем стандартный шрифт PIL
    # Рассчитываем приблизительное позиционирование
    text_x = size // 2 - 8
    text_y = size // 2 - 12
    
    # Рисуем прямоугольник, который будет похож на букву M
    draw.rectangle([text_x, text_y, text_x + 16, text_y + 24], fill=(255, 255, 255))
    # Добавляем внутренние элементы для имитации M
    draw.rectangle([text_x + 2, text_y + 2, text_x + 6, text_y + 22], fill=(76, 175, 80))
    draw.rectangle([text_x + 10, text_y + 2, text_x + 14, text_y + 22], fill=(76, 175, 80))
    
    img.save(filename)

# Создаем иконки
sizes_and_names = [
    (16, "icon16.png"),
    (48, "icon48.png"),
    (128, "icon128.png")
]

for size, name in sizes_and_names:
    create_placeholder_icon(size, name)
    print(f"Создана иконка {name} размером {size}x{size}")