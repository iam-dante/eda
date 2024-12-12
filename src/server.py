from flask import Flask, request, jsonify 
from flask_cors import CORS 
import os
import chromadb
import fitz
import spacy
import re
from chromadb.utils import embedding_functions

app = Flask(__name__)
CORS(app)

nlp = spacy.load("en_core_web_sm")  
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

def format_text(text:str) -> str: return text.replace("\n", " ").strip()

def extract_text_from_pdf(file_path):
    # Open the file and read it as bytes
    with open(file_path, "rb") as pdf_file:
        pdf_bytes = pdf_file.read()  # Read the entire PDF as bytes
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            pages_text = []
            for page_number, page in enumerate(doc):
                text = page.get_text()
                text = format_text(text)  # Apply your custom text formatting
                pages_text.append({
                    "page_number": page_number + 1,
                    "text": str(text),
                })
    return pages_text

def process_text(pages_text, slice_size=12):
    long_chunks = []
    long_chunks_metadata = []

    # Function to split sentences into chunks
    def sentence_split(sentences_list: list[str], slice_size: int) -> list[list[str]]:
        return [sentences_list[i:i + slice_size] for i in range(0, len(sentences_list), slice_size)]

    # Process each item in pages_text
    for item in pages_text:
        try:
            if isinstance(item["text"], str):
                # Split text into sentences
                doc = nlp(item["text"])
                item["sentences"] = [str(sentence) for sentence in list(doc.sents)]
                item["number_sentences"] = len(item["sentences"])

                # Split sentences into chunks
                item["chunk_sentences"] = sentence_split(sentences_list=item["sentences"], slice_size=slice_size)
                item["number_chunk_sentences"] = len(item["chunk_sentences"])

                # Combine chunks into a string and clean up
                for chunk in item["chunk_sentences"]:
                    chunks_dict = {}
                    chunks_dict["page_number"] = item["page_number"]

                    joined_sent_chunks = "".join(chunk).replace("\xa0", "").strip()
                    joined_sent_chunks = re.sub(r'\.([A-Z])', r'. \1', joined_sent_chunks)  # Add space after a complete sentence

                    long_chunks.append(joined_sent_chunks)
                    long_chunks_metadata.append(chunks_dict)
            else:
                raise TypeError("Item text is not a string")
        except Exception as e:
            print(f"Error processing item: {e}")

    # Return Long chunks, metadata (pages number) and idx for long chunk (used in chromadb)
    return long_chunks, long_chunks_metadata



def list_pdf_files():
    """
    List PDF files in the current directory
    
    :return: List of PDF filenames
    """
    pdf_files = [f for f in os.listdir('./uploads') if f.lower().endswith('.pdf')]
    return pdf_files


file_path = list_pdf_files()[0]

print(file_path)

def chroma_vector():
    """
    Create a ChromaDB vector collection from a PDF file
    
    :param file_path: Path to the PDF file
    :return: ChromaDB collection or None if file path is invalid
    """
    # Check if file path is empty or None
    # if not file_path or not isinstance(file_path, str):
    #     print("Error: Invalid file path. Please provide a valid file path.")
    #     return None
    
    # # Check if file exists
    # if not os.path.exists(file_path):
    #     print(f"Error: File not found at {file_path}")
    #     return None
    

    # Extract text from PDF (you'll need to implement or import this function)
    page_text = extract_text_from_pdf(f'./uploads/{file_path}')
    
    # Process text into chunks (you'll need to implement or import this function)
    long_chunks, long_chunks_metadata = process_text(page_text)
    
    # Initialize ChromaDB client
    chroma_client = chromadb.Client()
    
    # Get or create a collection
    collection = chroma_client.get_or_create_collection(
        name="current_pdf"
        # Uncomment and configure embedding function if needed
        # embedding_function=sentence_transformer
    )
    
    # Generate sequential IDs
    idx = [str(i) for i in range(0, len(long_chunks_metadata))]
    
    # Add data to the collection
    collection.add(
        documents=long_chunks,
        metadatas=long_chunks_metadata,
        ids=idx
    )
    
    print(f"Successfully created vector collection with {len(long_chunks)} chunks")
    return collection
    
    # except Exception as e:
    #     print(f"An error occurred while processing the file: {e}")
    #     return None

collection = chroma_vector()
print(collection)
results = collection.query(
    query_texts=["What is brian name"], 
    n_results=2
)

print(results)

if __name__ == '__main__':
    app.run(debug=True)

