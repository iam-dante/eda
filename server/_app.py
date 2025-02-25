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
import subprocess
import openai

# Initialize Flask app
app = Flask(__name__)
CORS(app)


# Allowed file types & max size
ALLOWED_EXTENSIONS = {'txt', 'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

load_dotenv()

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

# Load SpaCy model
import subprocess

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")


# Configure logging
logging.basicConfig(level=logging.INFO)

instance_id = str(uuid.uuid4())
collection_name = f"documents_{instance_id}"

# def get_or_create_collection():
#     """Ensure a single ChromaDB collection exists."""
#     global collection_name
#     try:
#         collection = chroma_client.get_collection(name=collection_name)
#     except:
#         collection = chroma_client.create_collection(name=collection_name)
#     return collection

# def extract_text_from_pdf(file_stream):
#     """Extract text from a PDF file."""
#     pdf_bytes = file_stream.read()
#     with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
#         pages_text = [
#             {"page_number": page_number + 1, "text": page.get_text()}
#             for page_number, page in enumerate(doc)
#         ]
#     return pages_text

# def process_uploaded_file(file):
#     """Extract text from uploaded files."""
#     try:
#         if file.filename.lower().endswith('.pdf'):
#             return extract_text_from_pdf(file)
#         elif file.filename.lower().endswith('.txt'):
#             text = file.read().decode('utf-8')
#             return [{"page_number": 1, "text": text}]
#         else:
#             return None
#     except Exception as e:
#         logging.error(f"Error processing file: {e}")
#         return None

# def process_text(pages_text, slice_size=6):
#     """Convert extracted text into structured chunks for ChromaDB."""
#     long_chunks = []
#     long_chunks_metadata = []

#     def sentence_split(sentences_list, slice_size):
#         return [sentences_list[i:i + slice_size] for i in range(0, len(sentences_list), slice_size)]

#     for item in pages_text:
#         try:
#             if isinstance(item["text"], str):
#                 doc = nlp(item["text"])
#                 sentences = [str(sentence) for sentence in list(doc.sents)]
#                 chunks = sentence_split(sentences, slice_size)

#                 for chunk in chunks:
#                     chunk_text = " ".join(chunk).replace("\xa0", "").strip()
#                     chunk_text = re.sub(r'\.([A-Z])', r'. \1', chunk_text)

#                     long_chunks.append(chunk_text)
#                     long_chunks_metadata.append({"page_number": item["page_number"]})
#             else:
#                 raise TypeError("Item text is not a string")
#         except Exception as e:
#             logging.error(f"Error processing text: {e}")

#     return long_chunks, long_chunks_metadata

# def save_to_chromadb(file):
#     """Process the file and store chunks in ChromaDB."""
#     if file.filename == '':
#         return {'error': 'No file selected'}, 400

#     if not file.filename.lower().endswith(tuple(ALLOWED_EXTENSIONS)):
#         return {'error': f'File type not allowed. Allowed types: {ALLOWED_EXTENSIONS}'}, 400

#     file_id = str(uuid.uuid4())
#     pages_text = process_uploaded_file(file)

#     if not pages_text:
#         return {'error': 'Failed to process file'}, 500

#     try:
#         long_chunks, long_chunks_metadata = process_text(pages_text)
#         logging.info(f"Number of long chunks: {len(long_chunks)}")
#         collection = get_or_create_collection()

#         if collection:
#             collection.add(
#                 documents=long_chunks,
#                 ids=[f"{file_id}_{i}" for i in range(len(long_chunks))],
#                 metadatas=[{**meta, "file_id": file_id} for meta in long_chunks_metadata]
#             )
#             return {'message': 'File processed and uploaded successfully', 'file_id': file_id}, 200
#     except Exception as e:
#         logging.error(f"Failed to process file: {e}")
#         return {'error': f'Failed to process file: {str(e)}'}, 500

#     return {'error': 'Failed to process file'}, 500
import re
import unicodedata

def clean_text_(text):
    # text = text.replace("\n", " ")  # Replace newlines with spaces
    text = re.sub(r'\s+', ' ', str(text))  # Remove extra spaces
    return text.strip()  # Trim leading and trailing spaces

def remove_special_chars(text):
    text = re.sub(r'[^a-zA-Z0-9.,!?\'" ]', '', text)  # Keep letters, numbers, and common punctuation
    return text

def fix_hyphenation(text):
    return re.sub(r'(\w+)-\s+(\w+)', r'\1\2', text)  # Removes hyphenation across lines

def normalize_unicode(text):
    return unicodedata.normalize("NFKD", text)

def remove_headers_footers(text):
    lines = text.split("\n")
    cleaned_lines = [line for line in lines if not re.match(r'(Page \d+|Confidential|Company Name)', line)]
    return " ".join(cleaned_lines)

def normalize_text(text):
    return " ".join(text.lower().split())

def full_text_cleanup(text):
    """"
    Takes in unclean text and return cleaned text by applying a series of cleaning functions.
    
    """
    text = clean_text_(text)
    text = fix_hyphenation(text)
    text = remove_special_chars(text)
    text = normalize_unicode(text)
    text = remove_headers_footers(text)
    text = normalize_text(text)
    
    return text

from langchain.document_loaders import PyMuPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.text_splitter import NLTKTextSplitter

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

    return{'message': 'File processed and uploaded successfully', 'data':lang_sentences }, 200

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and store in ChromaDB."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    _, status = create_resources(file)
    return jsonify(_), status

# @app.route('/extract_text', methods=['POST'])
# def extract_text():
#     """Return extracted text before processing."""
#     if 'file' not in request.files:
#         return jsonify({'error': 'No file part in the request'}), 400

#     file = request.files['file']
#     pages_text = process_uploaded_file(file)
    
#     if pages_text:
#         return jsonify({'text': pages_text}), 200
#     return jsonify({'error': 'Failed to extract text'}), 500

def ask_ollama(query, context=None):
    """Query OLLAMA model with extracted context."""
    grok_prompt = f"""
        ### Prompt for RAG System

            **Instruction:**
            You are an AI designed to answer queries using a two-step process involving context retrieval and knowledge-based answering. Here's how you should proceed:

            1. **Context Retrieval (Step 1):**
            - **Context:** {context}
            - **Query:** {query}

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
    
def llm_online(query, context=None):
    """Query OLLAMA model with extracted context."""

    if context:
        prompt = f"""You are an expert information retriever.  Answer the user's question using *only* the information provided in the context below.  If the context does not contain the answer, try to use your general knowledge.  Do not mention the context in your response.
        **Context:**
        {context}

        **Question:**
        {query}

        **Answer:**
        """
    else:
        prompt = f"""
        Please answer the following question:
        {query}
        """

    client = openai.OpenAI(
        api_key=SAMBANOVA_API_KEY,
        base_url="https://api.sambanova.ai/v1",
    )

    response = client.chat.completions.create(
        model="Meta-Llama-3.3-70B-Instruct",
        messages=[{"role":"system","content":prompt}],
        temperature=0.7,
        top_p=0.1
    )


    return response.choices[0].message.content


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
        # answer = llm_online(user_input, context)
        
        return jsonify({"results": answer}), 200

    except Exception as e:
        logging.error(f"Search failed: {e}")
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run()
