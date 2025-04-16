import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import OpenAI from "openai";

export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const { messages, fileid, document } = await req.json();

    // Get the last user message (assuming messages is an array of message objects)
    const lastUserMessage = Array.isArray(messages)
      ? messages.filter((m) => m.role === "user").pop()?.content || ""
      : messages;

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

    const model = groq("mistral-saba-24b");

    // Stream the response using the groq model
    const result = streamText({
      model,
      prompt,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    // Log the error for debugging purposes
    console.error("Chat API error:", error);

    // Construct a more informative error response
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
