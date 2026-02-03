// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand(); // Развернуть приложение на весь экран
tg.enableClosingConfirmation(); // Подтверждение закрытия

// Элементы
const positiveInput = document.getElementById('positive');
const negativeInput = document.getElementById('negative');
const stepsSlider = document.getElementById('steps');
const stepsValue = document.getElementById('stepsValue');
const modelSelect = document.getElementById('model');
const generateBtn = document.getElementById('generateBtn');
const emptyState = document.getElementById('emptyState');
const loader = document.getElementById('loader');
const resultContainer = document.getElementById('resultContainer');
const resultImage = document.getElementById('resultImage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const downloadBtn = document.getElementById('downloadBtn');
const newBtn = document.getElementById('newBtn');

// Обновление значения слайдера
stepsSlider.addEventListener('input', (e) => {
    stepsValue.textContent = e.target.value;
});

// Генерация изображения
generateBtn.addEventListener('click', async () => {
    const positive = positiveInput.value.trim();
    const negative = negativeInput.value.trim();
    const steps = parseInt(stepsSlider.value);
    const model = modelSelect.value;

    // Проверка промпта
    if (!positive) {
        showError('Пожалуйста, опишите что вы хотите увидеть');
        tg.HapticFeedback.notificationOccurred('error');
        return;
    }

    // Показать загрузку
    showLoader();
    tg.HapticFeedback.impactOccurred('medium');

    try {
        // 🔧 ЗДЕСЬ НУЖНО ПОДСТАВИТЬ ВАШ API
        const imageUrl = await generateImageWithComfyUI(positive, negative, steps, model);
        
        // Показать результат
        showResult(imageUrl);
        tg.HapticFeedback.notificationOccurred('success');
        
    } catch (error) {
        console.error('Ошибка генерации:', error);
        showError('Ошибка при генерации изображения. Попробуйте еще раз.');
        tg.HapticFeedback.notificationOccurred('error');
    }
});

// Кнопка "Еще раз"
newBtn.addEventListener('click', () => {
    hideResult();
    positiveInput.focus();
    tg.HapticFeedback.impactOccurred('light');
});

// Кнопка "Скачать"
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = resultImage.src;
    link.download = `ai-image-${Date.now()}.png`;
    link.click();
    tg.HapticFeedback.impactOccurred('medium');
});

// 🔧 ФУНКЦИЯ ДЛЯ РАБОТЫ С COMFYUI API
// Замените эту функцию на реальную работу с вашим ComfyUI сервером
async function generateImageWithComfyUI(positive, negative, steps, model) {
    // ============================================
    // ЗДЕСЬ НУЖНО ВСТАВИТЬ ВАШ КОД ДЛЯ COMFYUI
    // ============================================
    
    // Пример структуры запроса к ComfyUI:
    /*
    const response = await fetch('ВАШ_COMFYUI_URL/prompt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: {
                // Здесь ваш workflow ComfyUI
                "3": {
                    "inputs": {
                        "text": positive,
                        // остальные параметры
                    },
                    "class_type": "CLIPTextEncode"
                },
                // ... остальные ноды
            }
        })
    });
    
    const data = await response.json();
    const promptId = data.prompt_id;
    
    // Ожидание завершения генерации
    await waitForCompletion(promptId);
    
    // Получение изображения
    const imageUrl = await getImage(promptId);
    return imageUrl;
    */
    
    // ⚠️ ВРЕМЕННАЯ ЗАГЛУШКА ДЛЯ ДЕМОНСТРАЦИИ
    // Удалите этот код и вставьте свой
    return new Promise((resolve) => {
        setTimeout(() => {
            // Это просто placeholder изображение для примера
            resolve('https://via.placeholder.com/512x512/3390ec/ffffff?text=AI+Generated');
        }, 2000);
    });
}

// Вспомогательные функции для отображения состояний
function showLoader() {
    emptyState.style.display = 'none';
    loader.style.display = 'block';
    resultContainer.style.display = 'none';
    errorMessage.style.display = 'none';
    generateBtn.disabled = true;
    generateBtn.style.opacity = '0.6';
}

function showResult(imageUrl) {
    emptyState.style.display = 'none';
    loader.style.display = 'none';
    resultContainer.style.display = 'block';
    errorMessage.style.display = 'none';
    resultImage.src = imageUrl;
    generateBtn.disabled = false;
    generateBtn.style.opacity = '1';
}

function hideResult() {
    emptyState.style.display = 'block';
    loader.style.display = 'none';
    resultContainer.style.display = 'none';
    errorMessage.style.display = 'none';
}

function showError(message) {
    emptyState.style.display = 'none';
    loader.style.display = 'none';
    resultContainer.style.display = 'none';
    errorMessage.style.display = 'block';
    errorText.textContent = message;
    generateBtn.disabled = false;
    generateBtn.style.opacity = '1';
}

// Информация о пользователе Telegram (опционально)
console.log('Telegram User:', tg.initDataUnsafe.user);

// Отправка данных в бота (опционально)
// tg.sendData(JSON.stringify({ action: 'image_generated', imageUrl: '...' }));
