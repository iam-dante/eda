import { streamText } from "ai";
// import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";
import OpenAI from "openai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // const model = groq("mistral-saba-24b");
    const model = openai("gpt-4o");
    // const { textStream } = streamText({
    //   model: openai("gpt-4o"),
    //   prompt: "Invent a new holiday and describe its traditions.",
    // });
    // Stream the response
    const result = streamText({
      model,
      prompt,
    });

    // const openai = new OpenAI({
    //   apiKey: process.env.OPENAI_API_KEY,
    // });

    // const response = await openai.completions.create({
    //   model: "gpt-4.0-turbo",
    //   prompt: prompt,
    //   stream: true,
    // });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
