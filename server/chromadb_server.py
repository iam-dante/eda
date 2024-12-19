import os
import chromadb
import fitz
import spacy
import re
from chromadb.utils import embedding_functions
import anthropic
from dotenv import load_dotenv
import json
import requests


nlp = spacy.load("en_core_web_sm")  

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

def process_text(pages_text, slice_size=6):
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
    pdf_files = [f for f in os.listdir('../uploads') if f.lower().endswith('.pdf')]
    return pdf_files



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
    
    # file_path = list_pdf_files()[0]
    # need to change this to be online database
    # and not take something on the file path
    file_path = "./uploads/BrianTemuResume_.pdf"

    # Extract text from PDF (you'll need to implement or import this function)
    # page_text = extract_text_from_pdf(f'../uploads/{file_path}')
    page_text = extract_text_from_pdf(file_path)
    
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

def ask_ollama(query, context):
     
    base_prompt = f"""
            By using the context try to answer the query of the user

            Context:
            {context}

            **User Query**: {query}
            """
     
    url = "http://localhost:11434/api/generate"

    headers ={
        "Content-Type": "application/json"
    }

    data = {
        "model":"llama3.2",
        "prompt": base_prompt,
        "stream": False,
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


# def ask_claude(query, context):

#     # context = "- " + "\n- ".join(context[0])
#     base_prompt = f"""
#                 Based on the following context, provide a clear and detailed answer to the user's query. Extract only relevant passages from the context to ensure accuracy. Focus on explanatory and structured answers, similar to the example responses below.

#                 Context:
#                 {context}

#                 **User Query**: {query}

#                 **Answer**:\n

#                 Please return only answer of this question

#                 """
    

    
#     # Load environment variables from the .env file
#     load_dotenv() 

#     # Access the variables
#     an_api_key = os.getenv("ANTHROPIC_API_KEY")

#     client = anthropic.Anthropic(api_key=an_api_key)

#     message = client.messages.create(
#         model="claude-3-5-sonnet-20240620",
#         max_tokens=1000,
#         temperature=0.7,
#         system="Use the context provided to answer the following query",
#         messages=[
#             {
#                 "role": "user",
#                 "content": [
#                     {
#                         "type": "text",
#                         "text": base_prompt
#                     }
#                 ]
#             }
#         ]
#     )
#     return message.content[0].text