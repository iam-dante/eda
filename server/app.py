from flask import Flask, request, jsonify
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
from groq import Groq
import nltk
import fitz

nltk.download('punkt')
# On server 
nltk.data.path.append('/opt/render/nltk_data')
nltk.download('punkt', download_dir='/opt/render/nltk_data')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

load_dotenv()

# Allowed file types & max size
ALLOWED_EXTENSIONS = {'txt', 'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

CHROMADB_API_TOKEN = os.getenv('CHROMA_API_KEY')
SAMBANOVA_API_KEY = os.getenv('SAMBANOVA_API_KEY')
client = Groq(api_key=os.environ.get("GROQ_API_KEY"),)


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


# Global variable to store current collection info
current_collection_id = None
current_collection_name = None

def get_or_create_collection():
    """Ensure a single ChromaDB collection exists."""
    global current_collection_id, current_collection_name
    
    if not current_collection_id:
        current_collection_id = str(uuid.uuid4())
        current_collection_name = f"documents_{current_collection_id}"
        collection = chroma_client.create_collection(name=current_collection_name)
    else:
        try:
            collection = chroma_client.get_collection(name=current_collection_name)
        except:
            current_collection_id = str.uuid.uuid4()
            current_collection_name = f"documents_{current_collection_id}"
            collection = chroma_client.create_collection(name=current_collection_name)
    
    return collection, current_collection_name

def create_resources_from_bytes(pdf_stream):
    """Modified version of create_resources to work with BytesIO instead of file path"""
    
    try:
        doc = fitz.open(stream=pdf_stream)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        
        if not text.strip():
            logging.error("No text extracted from PDF")
            return []
        
        lang_cleaned_text = lang_clean_text(text)
        if not lang_cleaned_text:
            logging.error("No text after cleaning")
            return []
            
        lang_sentences = split_text_into_sentences(lang_cleaned_text[0])
        if not lang_sentences:
            logging.error("No sentences extracted")
            return []
            
        return lang_sentences
    except Exception as e:
        logging.error(f"Error in create_resources_from_bytes: {str(e)}")
        return []

def save_to_chromadb(file):
    """Save file to ChromaDB."""
    try:
        # Basic validations
        if file.filename == '':
            return {'error': 'No file selected'}, 400

        filename = file.filename
        # ...existing validation code...

        # Create new collection for this upload
        global current_collection_id, current_collection_name
        current_collection_id = str(uuid.uuid4())
        current_collection_name = f"documents_{current_collection_id}"
        
        try:
            collection = chroma_client.create_collection(name=current_collection_name)
        except Exception as e:
            logging.error(f"Error creating collection: {str(e)}")
            return {'error': 'Failed to create new collection'}, 500

        # Read file contents into memory
        file_bytes = file.read()
        
        # Create a BytesIO object to work with PyMuPDF
        from io import BytesIO
        pdf_stream = BytesIO(file_bytes)
        
        # Process the file and get resources
        resources = create_resources_from_bytes(pdf_stream)
        
        if not resources:
            return {'error': 'No valid text content could be extracted'}, 400

        # Add documents to collection
        try:
            collection.add(
                documents=resources,
                ids=[f"{uuid.uuid4()}" for _ in range(len(resources))]
            )
            
            return {
                'message': 'File processed and uploaded successfully',
                'documents_processed': len(resources),
                'collection_id': current_collection_id,
                'filename': filename
            }, 200
            
        except Exception as e:
            logging.error(f"Error adding documents to collection: {str(e)}")
            return {'error': 'Failed to store documents'}, 500

    except Exception as e:
        logging.error(f"Error in save_to_chromadb: {str(e)}")
        return {'error': str(e)}, 500


@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and store in ChromaDB."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    response, status = save_to_chromadb(file)
    return jsonify(response), status

def ask_groq(query, context=None, document=None):
    grok_prompt = f"""
            ### Prompt for RAG System

            **Instruction:**  
            You are an AI designed to answer queries using a three-step process involving context retrieval, document reference, and knowledge-based answering. Here's how you should proceed:

            1. **Context Retrieval (Step 1):**  
            - **Document:** {document}  
            - **Context:** {context}  
            - **Query:** {query.lower()}  

            First, attempt to answer the query using the provided context. Look for relevant information within the context that directly relates to the query. If you can answer the query comprehensively using only this context, do so. If you cannot, proceed to use the entire document. Search for information in the document that can help answer the query. If you can answer using the document, do so. If you still cannot answer adequately, proceed to step 2.

            2. **Knowledge-Based Answer (Step 2):**  
            - If neither the context nor the document provides enough information to answer the query accurately, use your pre-existing knowledge to answer the query.

            **Guidelines:**  
            - **Accuracy:** Prioritize accuracy. If you are using your knowledge and are uncertain or the information might be outdated, you may include a disclaimer like "I'm not certain, but...".  
            - **Completeness:** If part of the query can be answered with the context or document but not fully, use those sources for what you can and supplement with knowledge.  
            - **Citations:** When possible, integrate information from the context or document seamlessly into your answer without explicitly stating the source, unless it is necessary for clarity or to provide a direct quote.  
            
            **Proceed:**  
            Now, attempt to answer the query provided:  

            **Query:** {query}  

            Your answer should be a direct, detailed, and simple explanation of the concept. Do not list steps or any other things. Do not mention the context, document, or question in your answer unless it is necessary for understanding. If you are uncertain about the information from your knowledge, you may include a disclaimer like "I'm not certain, but...".

            DO NOT include "Based on the provided context and knowledge-based approach, I can attempt to answer the query."
            """

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": grok_prompt,
            }
        ],
        model="llama-3.3-70b-versatile",
    )

    return chat_completion.choices[0].message.content

def ask_ollama(query, context=None, document=None):
    """Query OLLAMA model with extracted context."""
    grok_prompt = f"""
            ### Prompt for RAG System

            **Instruction:**  
            You are an AI designed to answer queries using a three-step process involving context retrieval, document reference, and knowledge-based answering. Here's how you should proceed:

            1. **Context Retrieval (Step 1):**  
            - **Document:** {document}  
            - **Context:** {context}  
            - **Query:** {query.lower()}  

            First, attempt to answer the query using the provided context. Look for relevant information within the context that directly relates to the query. If you can answer the query comprehensively using only this context, do so. If you cannot, proceed to use the entire document. Search for information in the document that can help answer the query. If you can answer using the document, do so. If you still cannot answer adequately, proceed to step 2.

            2. **Knowledge-Based Answer (Step 2):**  
            - If neither the context nor the document provides enough information to answer the query accurately, use your pre-existing knowledge to answer the query.

            **Guidelines:**  
            - **Accuracy:** Prioritize accuracy. If you are using your knowledge and are uncertain or the information might be outdated, you may include a disclaimer like "I'm not certain, but...".  
            - **Completeness:** If part of the query can be answered with the context or document but not fully, use those sources for what you can and supplement with knowledge.  
            - **Citations:** When possible, integrate information from the context or document seamlessly into your answer without explicitly stating the source, unless it is necessary for clarity or to provide a direct quote.  
            
            **Proceed:**  
            Now, attempt to answer the query provided:  

            **Query:** {query}  

            Your answer should be a direct, detailed, and simple explanation of the concept. Do not list steps or any other things. Do not mention the context, document, or question in your answer unless it is necessary for understanding. If you are uncertain about the information from your knowledge, you may include a disclaimer like "I'm not certain, but...".

            DO NOT include "Based on the provided context and knowledge-based approach, I can attempt to answer the query."
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

        # Get the current collection
        collection, _ = get_or_create_collection()
        
        if not collection:
            return jsonify({"error": "No documents available. Please upload a file first."}), 400
            
        results = collection.query(query_texts=[user_input], n_results=4)
        documents = collection.get()['documents']

        context = "\n".join(results['documents'][0]) if results['documents'][0] else ""
        answer = ask_groq(user_input, context, documents)
        
        return jsonify({"results": answer}), 200

    except Exception as e:
        logging.error(f"Search failed: {e}")
        return jsonify({"error": f"Search failed: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)