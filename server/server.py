from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import chromadb
import json
import requests
from PyPDF2 import PdfReader
import uuid
import atexit
from datetime import datetime
import spacy
import re
import fitz  # PyMuPDF for PDF processing
import logging
from dotenv import load_dotenv

# Initialize Flask app
app = Flask(__name__)
CORS(app)


# Allowed file types & max size
ALLOWED_EXTENSIONS = {'txt', 'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

load_dotenv()

CHROMADB_API_TOKEN = os.getenv('CHROMA_API_KEY')


# Initialize ChromaDB client
chroma_client = chromadb.HttpClient(
    ssl=True,
    host='api.trychroma.com',
    tenant='c74d6ead-7a1a-4e7d-afbb-3dd8d548c5ed',
    database='rag-0a14d70f',
    headers={
        'x-chroma-token': CHROMADB_API_TOKEN
    }
)

# Load SpaCy model
nlp = spacy.load("en_core_web_sm")

# Configure logging
logging.basicConfig(level=logging.INFO)

instance_id = str(uuid.uuid4())
collection_name = f"documents_{instance_id}"

def get_or_create_collection():
    """Ensure a single ChromaDB collection exists."""
    global collection_name
    try:
        collection = chroma_client.get_collection(name=collection_name)
    except:
        collection = chroma_client.create_collection(name=collection_name)
    return collection

def extract_text_from_pdf(file_stream):
    """Extract text from a PDF file."""
    pdf_bytes = file_stream.read()
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        pages_text = [
            {"page_number": page_number + 1, "text": page.get_text()}
            for page_number, page in enumerate(doc)
        ]
    return pages_text

def process_uploaded_file(file):
    """Extract text from uploaded files."""
    try:
        if file.filename.lower().endswith('.pdf'):
            return extract_text_from_pdf(file)
        elif file.filename.lower().endswith('.txt'):
            text = file.read().decode('utf-8')
            return [{"page_number": 1, "text": text}]
        else:
            return None
    except Exception as e:
        logging.error(f"Error processing file: {e}")
        return None

def process_text(pages_text, slice_size=6):
    """Convert extracted text into structured chunks for ChromaDB."""
    long_chunks = []
    long_chunks_metadata = []

    def sentence_split(sentences_list, slice_size):
        return [sentences_list[i:i + slice_size] for i in range(0, len(sentences_list), slice_size)]

    for item in pages_text:
        try:
            if isinstance(item["text"], str):
                doc = nlp(item["text"])
                sentences = [str(sentence) for sentence in list(doc.sents)]
                chunks = sentence_split(sentences, slice_size)

                for chunk in chunks:
                    chunk_text = " ".join(chunk).replace("\xa0", "").strip()
                    chunk_text = re.sub(r'\.([A-Z])', r'. \1', chunk_text)

                    long_chunks.append(chunk_text)
                    long_chunks_metadata.append({"page_number": item["page_number"]})
            else:
                raise TypeError("Item text is not a string")
        except Exception as e:
            logging.error(f"Error processing text: {e}")

    return long_chunks, long_chunks_metadata

def save_to_chromadb(file):
    """Process the file and store chunks in ChromaDB."""
    if file.filename == '':
        return {'error': 'No file selected'}, 400

    if not file.filename.lower().endswith(tuple(ALLOWED_EXTENSIONS)):
        return {'error': f'File type not allowed. Allowed types: {ALLOWED_EXTENSIONS}'}, 400

    file_id = str(uuid.uuid4())
    pages_text = process_uploaded_file(file)

    if not pages_text:
        return {'error': 'Failed to process file'}, 500

    try:
        long_chunks, long_chunks_metadata = process_text(pages_text)
        logging.info(f"Number of long chunks: {len(long_chunks)}")
        collection = get_or_create_collection()

        if collection:
            collection.add(
                documents=long_chunks,
                ids=[f"{file_id}_{i}" for i in range(len(long_chunks))],
                metadatas=[{**meta, "file_id": file_id} for meta in long_chunks_metadata]
            )
            return {'message': 'File processed and uploaded successfully', 'file_id': file_id}, 200
    except Exception as e:
        logging.error(f"Failed to process file: {e}")
        return {'error': f'Failed to process file: {str(e)}'}, 500

    return {'error': 'Failed to process file'}, 500

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and store in ChromaDB."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    response, status = save_to_chromadb(file)
    return jsonify(response), status

@app.route('/extract_text', methods=['POST'])
def extract_text():
    """Return extracted text before processing."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    pages_text = process_uploaded_file(file)
    
    if pages_text:
        return jsonify({'text': pages_text}), 200
    return jsonify({'error': 'Failed to extract text'}), 500

def ask_ollama(query, context=None):
    """Query OLLAMA model with extracted context."""
    prompt = f"""You are an expert information retriever.  Answer the user's question using *only* the information provided in the context below.  If the context does not contain the answer, say "I cannot answer this question based on the provided information."  Do not mention the context in your response.  Be concise and direct.
    **Context:**
    {context}

    **Question:**
    {query}

    **Answer:**
    """

    url = "http://localhost:11434/api/generate"
    headers = {"Content-Type": "application/json"}
    data = {"model": "llama3.2", "prompt": prompt if context else query, "stream": False}

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json().get('response', 'Error: No response received')
    except Exception as e:
        logging.error(f"Error querying OLLAMA: {e}")
        return "Error retrieving response"

@app.route("/search", methods=["POST"])
def search():
    """Retrieve relevant data from ChromaDB and query OLLAMA."""
    try:
        data = request.get_json()
        user_input = data.get("text", "").strip()
        
        if not user_input:
            return jsonify({"error": "Missing user input"}), 400

        all_results = []
        collection = get_or_create_collection()
        collection_size = len(collection.get()['ids'])
        n_results = min(5, collection_size) if collection_size > 0 else 1
        print(n_results)
        
        results = collection.query(query_texts=[user_input], n_results=n_results)
        
        if results.get('documents', [[]])[0]:
            all_results.extend(results['documents'][0])

        context = "\n".join(all_results) if all_results else ""
        answer = ask_ollama(user_input, context)
        
        return jsonify({"results": answer}), 200

    except Exception as e:
        logging.error(f"Search failed: {e}")
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
