import os
import subprocess
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='public', static_url_path='')

# Carpeta estándar de música en tu laptop Linux
MUSIC_DIR = os.path.expanduser("~/Music")

@app.route('/')
def home():
    return send_from_directory('public', 'index.html')

@app.route('/api/buscar', methods=['GET'])
def buscar_en_youtube():
    q = request.args.get('q', '')
    if not q:
        return jsonify({"error": "Falta el parámetro"}), 400
    try:
        # Quitamos '--flat-playlist' para que extraiga los metadatos visuales reales de las 5 opciones
        comando = [
            "yt-dlp", 
            "ytsearch5:" + q, 
            "--dump-json", 
            "--skip-download"
        ]
        
        proceso = subprocess.Popen(comando, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = proceso.communicate()
        
        resultados = []
        for linea in stdout.decode('utf-8').split('\n'):
            if linea.strip():
                import json
                info = json.loads(linea)
                resultados.append({
                    "id": info.get("id"),
                    "title": info.get("title"),
                    "url": f"https://youtube.com{info.get('id')}",
                    "thumbnail": info.get("thumbnail") # Extraemos el enlace de la imagen
                })
                
        return jsonify({"resultados": resultados, "source": "youtube"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

        # yt-dlp devuelve un objeto JSON por cada línea en los resultados de búsqueda
        for linea in stdout.decode('utf-8').split('\n'):
            if linea.strip():
                import json
                info = json.loads(linea)
                resultados.append({
                    "id": info.get("id"),
                    "title": info.get("title"),
                    "url": f"https://youtube.com{info.get('id')}"
                })
                
        return jsonify({"resultados": resultados, "source": "youtube"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Nueva ruta auxiliar necesaria para extraer el audio de la canción elegida de la lista
@app.route('/api/stream_url', methods=['GET'])
def extraer_stream_url():
    url = request.args.get('url', '')
    if not url:
        return jsonify({"error": "Falta la URL"}), 400
    try:
        comando = ["yt-dlp", "--get-url", "-f", "ba", url]
        url_streaming = subprocess.check_output(comando).decode("utf-8").strip()
        return jsonify({"streaming_url": url_streaming})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

        # Extrae el streaming directo en formato compatible
        comando = ["yt-dlp", "--get-url", "-f", "ba", f"ytsearch1:{q}"]
        url_streaming = subprocess.check_output(comando).decode("utf-8").strip()
        return jsonify({"streaming_url": url_streaming, "source": "youtube"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/offline', methods=['GET'])
def listar_musica_local():
    try:
        if not os.path.exists(MUSIC_DIR):
            os.makedirs(MUSIC_DIR, exist_ok=True)
        canciones = [f for f in os.listdir(MUSIC_DIR) if f.endswith(".mp3")]
        return jsonify({"canciones": canciones, "source": "local"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Escucha en tu red local en el puerto 8080
    app.run(host="0.0.0.0", port=8080, debug=True)
