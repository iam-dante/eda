# pip install chromadb

import chromadb
client = chromadb.HttpClient(
  ssl=True,
  host='api.trychroma.com',
  tenant='c74d6ead-7a1a-4e7d-afbb-3dd8d548c5ed',
  database='moviesdb',
  headers={
      'x-chroma-token': 'ck-3FFLBCGVDgTS8UTuncr2ZDi3rJwhMArpheJx99LEyNX8'
  }
)

collection = client.get_or_create_collection('fruit')
collection.add(
  ids=['1', '2', '3'],
  documents=['apple', 'oranges', 'pineapple']
)
print(collection.query(query_texts='hawaii', n_results=1))
  