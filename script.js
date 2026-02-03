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
    const COMFYUI_URL = "https://pleochroitic-extraversively-kairi.ngrok-free.dev";
    
    try {
        // 1. Загружаем базовый workflow из файла
        const workflowResponse = await fetch('workflow_api.json');
        const workflow = await workflowResponse.json();
        
        // 2. Заменяем параметры в workflow
        // Найдем нужные ноды по вашей структуре
        
        // Positive prompt (нода 48 по вашему коду)
        if (workflow['41']) {
            workflow['41'].inputs.text = positive;
        }
        
        // Negative prompt (нода 50)
        if (workflow['32']) {
            workflow['32'].inputs.text = negative;
        }
        
        // Steps (нода 3)
        if (workflow['3']) {
            workflow['3'].inputs.steps = steps;
            workflow['3'].inputs.seed = Math.floor(Math.random() * 4294967295); // random seed
        }
        
        // Width/Height (нода 13)
        if (workflow['13']) {
            workflow['13'].inputs.width = 512;
            workflow['13'].inputs.height = 512;
        }
        
        // Style (нода 45)
        
        console.log('📤 Отправка запроса в ComfyUI...');
        
        // 3. Отправляем workflow в ComfyUI
        const response = await fetch(`${COMFYUI_URL}/prompt`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: workflow,
                client_id: "telegram-miniapp-" + Date.now()
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка ComfyUI: ${response.status}`);
        }

        const data = await response.json();
        const promptId = data.prompt_id;
        
        console.log('✅ Prompt ID:', promptId);
        
        // 4. Ждем завершения генерации
        console.log('⏳ Генерация изображения...');
        await waitForCompletion(promptId, COMFYUI_URL);
        
        // 5. Получаем информацию о файле
        const historyResponse = await fetch(`${COMFYUI_URL}/history/${promptId}`);
        const history = await historyResponse.json();
        
        // 6. Извлекаем имя файла
        const outputs = history[promptId]?.outputs;
        
        if (!outputs) {
            throw new Error("Не удалось получить результаты");
        }
        
        let filename = null;
        let subfolder = null;
        
        for (const nodeId in outputs) {
            if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
                filename = outputs[nodeId].images[0].filename;
                subfolder = outputs[nodeId].images[0].subfolder;
                break;
            }
        }
        
        if (!filename) {
            throw new Error("Изображение не найдено в результатах");
        }
        
        console.log('✅ Изображение готово:', filename);
        
        // 7. Формируем URL изображения
        let imageUrl = `${COMFYUI_URL}/view?filename=${filename}&type=output`;
        if (subfolder) {
            imageUrl += `&subfolder=${subfolder}`;
        }
        
        return imageUrl;
        
    } catch (error) {
        console.error("❌ Ошибка генерации:", error);
        throw error;
    }
}

// Функция ожидания завершения
async function waitForCompletion(promptId, baseUrl, maxWait = 120000) {
    const startTime = Date.now();
    let lastLogTime = 0;
    
    while (Date.now() - startTime < maxWait) {
        try {
            const response = await fetch(`${baseUrl}/history/${promptId}`);
            const history = await response.json();
            
            // Проверяем есть ли наш prompt в истории
            if (history[promptId]) {
                const item = history[promptId];
                
                // Если есть outputs - значит готово
                if (item.outputs && Object.keys(item.outputs).length > 0) {
                    console.log("✅ Генерация завершена!");
                    return true;
                }
                
                // Проверяем ошибки
                if (item.status && item.status.status_str === "error") {
                    throw new Error(`Ошибка ComfyUI: ${JSON.stringify(item.status)}`);
                }
            }
            
            // Логируем каждые 3 секунды
            const elapsed = Date.now() - startTime;
            if (elapsed - lastLogTime > 3000) {
                console.log(`⏳ Ожидание... (${Math.floor(elapsed / 1000)}s)`);
                lastLogTime = elapsed;
            }
            
            // Ждем 1 секунду перед следующей проверкой
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error("⚠️ Ошибка проверки статуса:", error);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    throw new Error("⏰ Превышено время ожидания генерации (2 минуты)");
}

// Функция ожидания завершения
async function waitForCompletion(promptId, baseUrl, maxWait = 120000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
        try {
            const response = await fetch(`${baseUrl}/history/${promptId}`);
            const history = await response.json();
            
            // Проверяем есть ли наш prompt в истории
            if (history[promptId]) {
                const item = history[promptId];
                
                // Проверяем статус
                if (item.status) {
                    // Завершено успешно
                    if (item.status.completed === true) {
                        console.log("✅ Генерация завершена!");
                        return true;
                    }
                    
                    // Ошибка
                    if (item.status.status_str === "error") {
                        throw new Error(`Ошибка ComfyUI: ${JSON.stringify(item.status)}`);
                    }
                }
                
                // Если есть outputs - значит готово
                if (item.outputs && Object.keys(item.outputs).length > 0) {
                    console.log("✅ Генерация завершена!");
                    return true;
                }
            }
            
            // Ждем 1 секунду перед следующей проверкой
            console.log(`⏳ Проверка статуса... (${Math.floor((Date.now() - startTime) / 1000)}s)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error("⚠️ Ошибка проверки статуса:", error);
            // Продолжаем попытки
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    throw new Error("⏰ Превышено время ожидания генерации (2 минуты)");
}
    return new Promise((resolve) => {
        setTimeout(() => {
            // Это просто placeholder изображение для примера
            resolve('https://via.placeholder.com/512x512/3390ec/ffffff?text=AI+Generated');
        }, 2000);
    });


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
