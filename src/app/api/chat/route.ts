import { streamText } from "ai";
import { createOllama } from "ollama-ai-provider";
import { ChromaClient } from "chromadb";
import { DefaultEmbeddingFunction } from "chromadb";

// Set runtime to nodejs for native modules
export const runtime = "nodejs";

const defaultEF = new DefaultEmbeddingFunction();
const CHROMADB_API_TOKEN = process.env.CHROMA_API_KEY;

// Initialize Ollama client
const ollamaClient = createOllama({
  baseUrl: "http://localhost:11434/api/generate",
  headers: { "Content-Type": "application/json" },
});

// Initialize ChromaDB client
// const client = new ChromaClient({
//   path: "https://api.trychroma.com:8000",
//   auth: {
//     provider: "token",
//     credentials: CHROMADB_API_TOKEN,
//     tokenHeaderType: "X_CHROMA_TOKEN",
//   },
//   tenant: "c74d6ead-7a1a-4e7d-afbb-3dd8d548c5ed",
//   database: "rag-0a14d70f",
// });

// Initialize model handler
const model = ollamaClient("llama3.2");

// Allow streaming responses up to 100 seconds
export const maxDuration = 100;

export async function POST(req: Request) {
  try {
    const { messages, fileid, document } = await req.json();

    // Get the last user message (assuming messages is an array of message objects)
    const lastUserMessage = Array.isArray(messages)
      ? messages.filter((m) => m.role === "user").pop()?.content || ""
      : messages;

    console.log("Messages:", messages);

    // Get collection and query
    // const collection = await client.getCollection({
    //   name: `doc_${fileid}`,
    //   embeddingFunction: defaultEF,
    // });

    // // Query the collection
    // const queryResults = await collection.query({
    //   queryTexts: [lastUserMessage], // Use the user's last message as query
    //   nResults: 4,
    // });

    // Construct the prompt with proper template literals
    const prompt = `
You are an advanced Retrieval-Augmented Generation (RAG) system designed to provide accurate and concise answers based on retrieved documents. Use the following information to assist the user:

**Retrieved Document:**  
${document}

**User Query:**  
${lastUserMessage}

**Instructions:**  
1. Analyze the retrieved document and extract relevant information to address the user's query.  
2. Provide a clear, concise, and accurate response based solely on the document content.  
3. If the document lacks sufficient information to fully answer the query, state that explicitly and avoid speculation.  
4. Use natural language to ensure the response is easy to understand.  

**Response:**  
[Generate your answer here based on the document and query]
`;

    // Stream the response
    const result = streamText({
      model,
      prompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
