from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os 
import chromadb
from dotenv import load_dotenv
import re
import uuid
import unicodedata
from langchain_community.document_loaders import PyMuPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.text_splitter import NLTKTextSplitter
import requests
import logging
from utils import full_text_cleanup

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# app.secret_key = os.urandom(24)  # Set a secret key for the session

load_dotenv()

# Allowed file types & max size
ALLOWED_EXTENSIONS = {'txt', 'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

CHROMADB_API_TOKEN = os.getenv('CHROMA_API_KEY')
SAMBANOVA_API_KEY = os.getenv('SAMBANOVA_API_KEY')


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


def extract_text_langchain(pdf_path):
    loader = PyMuPDFLoader(pdf_path)
    documents = loader.load()
    return "\n".join([doc.page_content for doc in documents])


def lang_clean_text(text):
    # text = text.replace("\n", " ").strip()  
    text = full_text_cleanup(text)
    text_splitter = CharacterTextSplitter(chunk_size=100, chunk_overlap=20)
    return text_splitter.split_text(text)

def split_text_into_sentences(text):
    text_splitter = NLTKTextSplitter()
    sentences = text_splitter.split_text(text)
    cleaned_sentences = [sentence.replace("\n", " ") for sentence in sentences]
    return cleaned_sentences


def create_resources(file_path):
    lang_text = extract_text_langchain(file_path)
    lang_cleaned_text = lang_clean_text(lang_text)
    lang_sentences = split_text_into_sentences(lang_cleaned_text[0])
    return lang_sentences


def get_or_create_collection():
    """Ensure a single ChromaDB collection exists."""
    global collection_name
    instance_id = session.get('instance_id')
    collection_name = f"documents_{instance_id}"
    try:
        collection = chroma_client.get_collection(name=collection_name)
    except:
        collection = chroma_client.create_collection(name=collection_name)
    return collection

def create_resources_from_bytes(pdf_stream):
    """Modified version of create_resources to work with BytesIO instead of file path"""
    import fitz  # PyMuPDF
    
    doc = fitz.open(stream=pdf_stream)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    
    lang_cleaned_text = lang_clean_text(text)
    lang_sentences = split_text_into_sentences(lang_cleaned_text[0])
    return lang_sentences

def save_to_chromadb(file):
    """Save file to ChromaDB."""
    try:
        if file.filename == '':
            return {'error': 'No file selected'}, 400

        if not file:
            return {'error': 'No file selected'}, 400

        if file.filename.split('.')[-1].lower() not in ALLOWED_EXTENSIONS:
            return {'error': 'Invalid file type'}, 400

        if file.content_length > MAX_FILE_SIZE:
            return {'error': 'File too large'}, 400

        # Read file contents into memory
        file_bytes = file.read()
        
        # Create a BytesIO object to work with PyMuPDF
        from io import BytesIO
        pdf_stream = BytesIO(file_bytes)
        
        # Process the file and get resources
        resources = create_resources_from_bytes(pdf_stream)

        # Get or create collection
        collection = chroma_client.get_or_create_collection(name=collection_name)

        # Add documents to collection
        collection.add(
            documents=resources,
            ids=[f"{i}" for i in range(len(resources))]
        )

        # Return JSON-serializable response
        return {
            'message': 'File processed and uploaded successfully',
            'documents_processed': len(resources),
          
        }, 200

    except Exception as e:
        logging.error(f"Error in save_to_chromadb: {str(e)}")
        return {'error': str(e)}, 500


@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and store in ChromaDB."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']

    # Check if instance_id exists in session, if not create one
    if 'instance_id' not in session:
        session['instance_id'] = str(uuid.uuid4())
    
    instance_id = session['instance_id']
    global collection_name
    collection_name = f"documents_{instance_id}"

    response, status = save_to_chromadb(file)
    return jsonify(response), status


def ask_ollama(query, context=None):
    """Query OLLAMA model with extracted context."""
    grok_prompt = f"""
        ### Prompt for RAG System

            **Instruction:**
            You are an AI designed to answer queries using a two-step process involving context retrieval and knowledge-based answering. Here's how you should proceed:

            1. **Context Retrieval (Step 1):**
            - **Context:** {context}
            - **Query:** {query.lower()}

            First, attempt to answer the query using the provided context. Look for relevant information within the context that directly relates to the query. If you can answer the query comprehensively using only this context, do so. If you cannot:

            2. **Knowledge-Based Answer (Step 2):**
            - If the context does not provide enough information to answer the query accurately, or if the query is not adequately addressed by the context, use your pre-existing knowledge to answer the query. 
            - Be clear that you are now using your knowledge by starting your response with "Based on my knowledge:".

            **Guidelines:**
            - **Accuracy:** Prioritize accuracy. If the context does not provide a clear answer and your knowledge is uncertain or outdated, acknowledge this by saying, "I'm not certain about this, but based on my knowledge:".
            - **Completeness:** If part of the query can be answered with context but not fully, use context for what you can and supplement with knowledge.
            - **Citations:** When answering from context, if possible, reference or quote directly from the context by using quotation marks or by specifying where in the context the answer was found (e.g., "According to the context...").
            - **Admit Limitations:** If neither the context nor your knowledge can provide an answer, admit this by saying, "I do not have enough information to answer this query adequately."

            **Example Response Formats:**

            - **From Context:** "The context states that the boiling point of water at sea level is 100°C."
            - **From Knowledge:** "Based on my knowledge, the average adult human body contains approximately 60% water."
            - **Mixed:** "From the context, we learn that the Eiffel Tower was completed in 1889. Based on my knowledge, it was designed by Gustave Eiffel."
            - **Admitting Limitation:** "I do not have enough information to answer this query adequately."

            **Proceed:**
            Now, attempt to answer the query provided:

            **Query:** {query}

            Your answer should be just explain of your understanding of the question. Dont list steps or any other things. Just explain the concept. Dont say Based on my knowledge or Based on the provided context, on your answer
            Just answer the question directly and in detail simple way
            DONT MENTION ABOUT THE CONTEXT OR THE QUESTION IN YOUR ANSWER
    
    """

    url = "http://localhost:11434/api/generate"
    headers = {"Content-Type": "application/json"}
    data = {"model": "llama3.2", "prompt": grok_prompt, "stream": False}

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

        # all_results = []
        collection = get_or_create_collection()
        # collection_size = len(collection.get()['ids'])
        # n_results = min(5, collection_size) if collection_size > 0 else 1
        # print(n_results)
        
        results = collection.query(query_texts=[user_input], n_results=4)

        context = "\n".join(results['documents'][0]) if results['documents'][0] else ""
        answer = ask_ollama(user_input, context)
        # answer = llm_online(user_input, context)
        
        return jsonify({"results": answer}), 200

    except Exception as e:
        logging.error(f"Search failed: {e}")
        return jsonify({"error": f"Search failed: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)