from flask import Flask, jsonify, render_template, request
from google import genai
from PIL import Image
import os

app = Flask(__name__)

# Чтобы русский текст не превращался в кракозябры
app.config['JSON_AS_ASCII'] = False


def get_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "Не задан GEMINI_API_KEY. Добавь переменную окружения перед запуском сервера."
        )
    return genai.Client(api_key=api_key)


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

        model_name = 'gemini-2.5-flash'
        instruction = (
            "Ты — помощник Джарвис. Всегда отвечай строго на русском языке. "
            "Для математических формул используй LaTeX в форматах $...$ и $$...$$."
        )

        client = get_client()
        response = client.models.generate_content(
            model=model_name,
            config={'system_instruction': instruction},
            contents=contents,
        )

        return jsonify({"result": response.text})

    except Exception as e:
        print(f"Ошибка: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
