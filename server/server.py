from flask import Flask, request, jsonify 
from flask_cors import CORS 
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from chromadb_server import chroma_vector
import json
import requests

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', "pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db' 
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Chat Message Model
class ChatMessage(db.Model):
    __tablename__ = 'chat_message'
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'content': self.content,
            'timestamp': self.timestamp.isoformat()
        }

def init_db():
    with app.app_context():
        try:
            db.create_all()
            print("Database initialized successfully")
        except Exception as e:
            print(f"Error initializing database: {e}")

# Initialize database tables
init_db()

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


def ask_ollama(query):
     
    # base_prompt = f"""
    #         By using the context try to answer the query of the user

    #         Context:
    #         {context}

    #         **User Query**: {query}
    #         """
     
    url = "http://localhost:11434/api/generate"

    headers ={
        "Content-Type": "application/json"
    }

    data = {
        "model":"deepseek-r1:8b",
        "prompt": query,
        "stream": False,
        "stop": ["<think></think>"]
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))

    if response.status_code==200:
        # take the response and return only the answer
        response_message = response.text
        data=json.loads(response_message)
        return data['response']
    elif response.status_code==500:
        return "Internal Server Error"
    
    elif response.status_code==400:
        return "Bad Request"
    elif response.status_code==404:
        return "Not Found"
    else:
        return "Unknown Error"


@app.route("/search", methods=["POST"])
def search():
    # collection = chroma_vector()
    # data = request.get_json()
    # user_input = data["text"]

    # # Save user message
    # user_message = ChatMessage(role='user', content=user_input)
    # db.session.add(user_message)

    # results = collection.query(
    #     query_texts=[user_input], 
    #     n_results=2
    # )

    # claude_results = ask_ollama(user_input, results )

    # # Save assistant message
    # assistant_message = ChatMessage(role='assistant', content=claude_results)
    # db.session.add(assistant_message)
    # db.session.commit()

    # return jsonify({"results":claude_results, "message_id": assistant_message.id}), 200

    
    try:
        data = request.get_json()
        user_input = data["text"]
        if not user_input:
            return jsonify({"error": "Missing user input"}), 400

        # # Save user message
        # user_message = ChatMessage(role='user', content=user_input)
        # db.session.add(user_message)
        # db.session.commit()

        # # Get response from Ollama
        # collection = chroma_vector()
        # results = collection.query(query_texts=[user_input], n_results=2)
        claude_results = ask_ollama(user_input)

        # # Save assistant message
        # assistant_message = ChatMessage(role='assistant', content=claude_results)
        # db.session.add(assistant_message)
        # db.session.commit()

        return jsonify({
            "results": claude_results,
            # "message_id": assistant_message.id
        }), 200

    except Exception as e:
        # db.session.rollback()
        # sends a 500 error
        return jsonify({"error": str(e)}), 500
    
@app.route('/chat-history', methods=['GET'])
def get_chat_history():
    try:
        messages = ChatMessage.query.order_by(ChatMessage.timestamp).all()
        return jsonify({
            "history": [message.to_dict() for message in messages]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

