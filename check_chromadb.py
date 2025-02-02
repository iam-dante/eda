import chromadb

chroma_client = chromadb.PersistentClient(path="./chroma_db")

def check_chromadb():
    collection = chromadb.Client().list_collections()
    return collection

print(check_chromadb())
