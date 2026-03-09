async function solveTask() {
    const textInputField = document.getElementById('taskText');
    const imageInputField = document.getElementById('taskImage');
    const textInput = textInputField.value;
    const imageInput = imageInputField.files[0];
    const resultBox = document.getElementById('result');
    const loader = document.getElementById('loader');
    const btn = document.getElementById('solveBtn');

    if (!textInput.trim() && !imageInput) {
        alert("Пожалуйста, напиши условие задачи или прикрепи фото!");
        return;
    }

    const formData = new FormData();
    if (textInput.trim()) formData.append('text', textInput);
    if (imageInput) formData.append('image', imageInput);

    // 1. ПОДГОТОВКА ИНТЕРФЕЙСА
    btn.disabled = true;
    btn.innerText = "Думаю...";
    resultBox.classList.remove('hidden'); // Убеждаемся, что блок истории открыт

    // 2. СОЗДАЕМ БЛОК ДЛЯ НОВОГО ЗАПРОСА
    const qaBlock = document.createElement('div');
    qaBlock.className = 'qa-block'; // Дадим ему класс для красоты
    
    // Формируем текст того, что спросил пользователь
    let userMsgHTML = `<strong>Вы:</strong> ${textInput}`;
    if (imageInput) {
        userMsgHTML += `<br><span style="color: #888; font-size: 0.9em;">[Прикреплено фото: ${imageInput.name}]</span>`;
    }
    
    // Добавляем вопрос пользователя в блок
    qaBlock.innerHTML = `<div class="user-message">${userMsgHTML}</div>
                         <div class="ai-message" id="loading-${Date.now()}"><em>Джарвис ищет ответ...</em></div>
                         <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">`;
    
    // Добавляем этот блок в конец истории
    resultBox.appendChild(qaBlock);
    
    // Скроллим историю в самый низ, чтобы видеть новый запрос
    resultBox.scrollTop = resultBox.scrollHeight;

    // ОЧИЩАЕМ ПОЛЯ ВВОДА для следующего вопроса
    textInputField.value = '';
    imageInputField.value = '';

    // Внутри solveTask после отправки:
    document.getElementById('imagePreviewContainer').classList.add('hidden');

    try {
        const response = await fetch('/solve', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();

        // Находим место, куда нужно вставить ответ именно для ЭТОГО запроса
        const aiMessageDiv = qaBlock.querySelector('.ai-message');

        if (response.ok) {
            // 3. РЕНДЕРИМ ОТВЕТ
            aiMessageDiv.innerHTML = `<strong>Джарвис:</strong><br>` + marked.parse(data.result);
            
            // Запускаем поиск формул ТОЛЬКО в новом ответе (это работает быстрее)
            renderMathInElement(aiMessageDiv, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });

        } else {
            aiMessageDiv.innerHTML = `<span style="color:red">Ошибка сервера: ${data.error}</span>`;
        }
    } catch (error) {
        const aiMessageDiv = qaBlock.querySelector('.ai-message');
        aiMessageDiv.innerHTML = `<span style="color:red">Ошибка сети. Проверь подключение.</span>`;
    } finally {
        btn.disabled = false;
        btn.innerText = "Найти решение";
        // Еще раз скроллим вниз, так как ответ мог быть длинным
        resultBox.scrollTop = resultBox.scrollHeight;
    }
}
document.getElementById('taskImage').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const container = document.getElementById('imagePreviewContainer');
    const img = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            img.src = e.target.result;
            container.classList.remove('hidden'); // Показываем превью
        }
        
        reader.readAsDataURL(file);
    }
});

// Логика кнопки "Удалить фото"
document.getElementById('removeImageBtn').addEventListener('click', function() {
    const fileInput = document.getElementById('taskImage');
    const container = document.getElementById('imagePreviewContainer');
    
    fileInput.value = ""; // Очищаем сам input
    container.classList.add('hidden'); // Прячем превью
});