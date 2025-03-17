import { NextApiRequest, NextApiResponse } from "next";
import chromadb from "chromadb";
import { Groq } from "groq";

// Environment variables
const CHROMADB_API_TOKEN = process.env.CHROMA_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const client = new Groq({ apiKey: GROQ_API_KEY });

const chromaClient = new chromadb.HttpClient({
  ssl: true,
  host: "api.trychroma.com",
  tenant: "c74d6ead-7a1a-4e7d-afbb-3dd8d548c5ed",
  database: "rag-0a14d70f",
  headers: { "x-chroma-token": CHROMADB_API_TOKEN },
});

let currentCollectionId = null;
let currentCollectionName = null;

async function getOrCreateCollection() {
  if (!currentCollectionId) {
    currentCollectionId = uuidv4();
    currentCollectionName = `documents_${currentCollectionId}`;
    const collection = await chromaClient.createCollection({
      name: currentCollectionName,
    });
    return [collection, currentCollectionName];
  }
  try {
    const collection = await chromaClient.getCollection({
      name: currentCollectionName,
    });
    return [collection, currentCollectionName];
  } catch (error) {
    currentCollectionId = uuidv4();
    currentCollectionName = `documents_${currentCollectionId}`;
    const collection = await chromaClient.createCollection({
      name: currentCollectionName,
    });
    return [collection, currentCollectionName];
  }
}

async function askGroq(query, context = "", document = []) {
  const grokPrompt = `
    ### Prompt for RAG System
    **Instruction:**  
    You are an AI designed to answer queries using a three-step process involving context retrieval, document reference, and knowledge-based answering...

    **Query:** ${query}
  `; // Use your full prompt here

  const completion = await client.chat.completions.create({
    messages: [{ role: "user", content: grokPrompt }],
    model: "llama-3.3-70b-versatile",
  });

  return completion.choices[0].message.content;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ error: "Missing user input" });
    }

    const [collection] = await getOrCreateCollection();
    if (!collection) {
      return res
        .status(400)
        .json({ error: "No documents available. Please upload a file first." });
    }

    const results = await collection.query({
      query_texts: [text],
      n_results: 4,
    });
    const documents = (await collection.get()).documents;

    const context = results.documents[0]?.join("\n") || "";
    const answer = await askGroq(text, context, documents);

    res.status(200).json({ results: answer });
  } catch (error) {
    console.error("Search failed:", error);
    res.status(500).json({ error: `Search failed: ${error.message}` });
  }
}
