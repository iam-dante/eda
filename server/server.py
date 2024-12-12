from flask import Flask, request, jsonify 
from flask_cors import CORS 
import os

app = Flask(__name__)
CORS(app)


UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', "pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# making a dir in the server 
# This will need to be a cloud server and having a database that maps the users 
os.makedirs(UPLOAD_FOLDER, exist_ok=True) 

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Allowed types: {ALLOWED_EXTENSIONS}'}), 400

    if len(file.read()) > MAX_FILE_SIZE:
        return jsonify({'error': 'File is too large. Maximum size is 10MB.'}), 400

    file.seek(0)  # Reset file pointer after reading size
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)
    return jsonify({'message': 'File uploaded successfully', 'filepath': filepath}), 200


@app.route("/search", methods=["POST"])
def search():

    data = request.get_json()
    text = data["text"]

    result = text.upper()
    return jsonify({"results":result}), 200

if __name__ == '__main__':
    app.run(debug=True)

