from flask import Flask, render_template, request, jsonify
from google import genai # НОВЫЙ SDK
from PIL import Image
import os

app = Flask(__name__)

# Чтобы русский текст не превращался в кракозябры
app.config['JSON_AS_ASCII'] = False 

# Просим систему дать ключ из сейфа 'GEMINI_API_KEY'
api_key = os.environ.get("GEMINI_API_KEY") 
client = genai.Client(api_key=api_key)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/solve', methods=['POST'])
def solve():
    try:
        text = request.form.get('text', '')
        file = request.files.get('image')
        
        contents = []
        if text.strip():
            contents.append(text)
        
        if file:
            img = Image.open(file)
            contents.append(img)

        if not contents:
            return jsonify({"error": "Ни текста, ни фото не получено"}), 400

        # Добавляем системную инструкцию при создании модели
        model_name = 'gemini-2.5-flash'
        instruction = "Ты — помощник Джарвис. Всегда отвечай строго на русском языке. Для математических формул используй LaTeX в форматах $...$ и $$...$$."

        # Вызов теперь должен выглядеть так (используем системный промпт):
        response = client.models.generate_content(
            model=model_name,
            config={'system_instruction': instruction}, # Это заставит его говорить по-русски
            contents=contents
        )

        # В новом SDK ответ лежит просто в response.text
        return jsonify({"result": response.text})

    except Exception as e:
        print(f"Ошибка: {str(e)}")
        # Возвращаем ошибку в UTF-8
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Запуск сервера
    app.run(debug=True)