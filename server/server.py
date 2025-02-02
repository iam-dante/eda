from flask import Flask, request, jsonify 
from flask_cors import CORS 
import os
import chromadb
import json
import requests
from PyPDF2 import PdfReader
import uuid
import shutil
import atexit
from datetime import datetime

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx'}
MAX_FILE_SIZE = 10 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize ChromaDB with separate collections
chroma_client = chromadb.PersistentClient(path="./chroma_db")

def get_or_create_collection(file_id):
    """Get or create a collection for a specific file"""
    collection_name = f"document_{file_id}"
    try:
        return chroma_client.get_or_create_collection(name=collection_name)
    except Exception as e:
        print(f"ChromaDB collection error: {e}")
        return None

def extract_text_from_pdf(file_path):
    with open(file_path, 'rb') as file:
        reader = PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text()
    return text

def process_uploaded_file(file_path):
    try:
        if file_path.endswith('.pdf'):
            return extract_text_from_pdf(file_path)
        elif file_path.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        else:
            return None
    except Exception as e:
        print(f"Error processing file: {e}")
        return None

def cleanup_uploads():
    """Clean up uploads folder on server shutdown"""
    if os.path.exists(UPLOAD_FOLDER):
        shutil.rmtree(UPLOAD_FOLDER)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # chroma_client.reset()

# Register cleanup function to run on server shutdown
atexit.register(cleanup_uploads)

# Clean up on startup
cleanup_uploads()

def save_file(file):
    if file.filename == '':
        return {'error': 'No file selected'}, 400

    if not file.filename.lower().endswith(tuple(ALLOWED_EXTENSIONS)):
        return {'error': f'File type not allowed. Allowed types: {ALLOWED_EXTENSIONS}'}, 400

    # Clean up old files in the uploads directory
    for old_file in os.listdir(UPLOAD_FOLDER):
        old_file_path = os.path.join(UPLOAD_FOLDER, old_file)
        if os.path.isfile(old_file_path):
            os.remove(old_file_path)

    file.seek(0)
    file_id = str(uuid.uuid4())
    extension = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{file_id}.{extension}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    file.save(filepath)
    
    # Process file and create new collection
    content = process_uploaded_file(filepath)
    if content:
        try:
            # Create new collection for this file
            collection = get_or_create_collection(file_id)
            if collection:
                # Split content into chunks (simple splitting by paragraphs)
                chunks = [chunk.strip() for chunk in content.split('\n\n') if chunk.strip()]
                
                # Add chunks to collection
                collection.add(
                    documents=chunks,
                    ids=[f"{file_id}_{i}" for i in range(len(chunks))],
                    metadatas=[{
                        "filename": file.filename,
                        "filepath": filepath,
                        "timestamp": str(datetime.now()),
                        "chunk_id": i
                    } for i in range(len(chunks))]
                )
                return {
                    'message': 'File uploaded and processed successfully',
                    'file_id': file_id,
                    'filepath': filepath
                }, 200
        except Exception as e:
            return {'error': f'Failed to process file: {str(e)}'}, 500
    
    return {'error': 'Failed to process file'}, 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    response, status = save_file(file)
    return jsonify(response), status

def ask_ollama(query, context=None):

    if context is None:
        base_prompt=query
    else:
        base_prompt = f"""
        Based on the following context, please answer the query:

        Context:
        {context}

        Query: {query}
        """
    
    url = "http://localhost:11434/api/generate"
    headers = {"Content-Type": "application/json"}
    data = {
        "model": "llama3.2",
        "prompt": base_prompt,
        "stream": False,
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()['response']
    except Exception as e:
        return f"Error: {str(e)}"

@app.route("/search", methods=["POST"])
def search():
    try:
        data = request.get_json()
        user_input = data.get("text", "").strip()
        
        if not user_input:
            return jsonify({"error": "Missing user input"}), 400

        # Search across all collections
        all_results = []
        collections = chroma_client.list_collections()
        
        for collection_info in collections:
            collection = chroma_client.get_collection(collection_info.name)
            results = collection.query(
                query_texts=[user_input],
                n_results=10
            )
            if results['documents'][0]:
                all_results.extend(results['documents'][0])

        # Get the relevant context from all results
        context = "\n".join(all_results) if all_results else ""
        
        # Get response from Ollama
        answer = ask_ollama(user_input, context)
        
        return jsonify({"results": answer}), 200

    except Exception as e:
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

if __name__ == '__main__':
    # Ensure cleanup happens on startup
    cleanup_uploads()
    app.run(debug=True)

