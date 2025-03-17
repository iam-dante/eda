from flask import Flask, request, jsonify
import logging
import fitz  # PyMuPDF
from io import BytesIO
from langchain.text_splitter import CharacterTextSplitter
from langchain.text_splitter import NLTKTextSplitter
from utils import full_text_cleanup
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)

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

@app.route('/extract_text', methods=['POST'])
def extract_text():
    """API endpoint to extract text from uploaded PDF file"""
    
    # Check if file is present in request
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    # Check if filename is empty
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check if file is a PDF
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are supported'}), 400
    
    try:
        # Read file into memory
        file_stream = BytesIO(file.read())
        
        # Extract text
        sentences = create_resources_from_bytes(file_stream)
        
        if not sentences:
            return jsonify({'error': 'Failed to extract text from PDF'}), 500
        
        print(sentences)
        # Return extracted text
        return jsonify({
            'success': True,
            'sentences': sentences,
            'sentence_count': len(sentences)
        })
    
    except Exception as e:
        logging.error(f"Error processing PDF: {str(e)}")
        return jsonify({'error': f'Error processing PDF: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)